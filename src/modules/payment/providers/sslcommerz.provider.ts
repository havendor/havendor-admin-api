import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import appConfig from "../../../config/appConfig.js";
import {
  BillingInterval,
  ManualVerifyStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  Plan,
  Prisma,
} from "../../../generated/prisma/index.js";
import { prisma } from "../../../utility/index.js";
import { PaymentRecordService } from "../payment-record.service.js";
import { SubscriptionActivationService } from "../subscription-activation.service.js";

const baseUrl = () =>
  appConfig.SSLCOMMERZ.is_live
    ? "https://securepay.sslcommerz.com"
    : "https://sandbox.sslcommerz.com";

const ensureConfigured = () => {
  if (!appConfig.SSLCOMMERZ.store_id || !appConfig.SSLCOMMERZ.store_password) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "SSLCommerz is not configured",
      "Missing SSLCommerz credentials",
    );
  }
};

const apiBase = () =>
  `${appConfig.PUBLIC_API_BASE_URL}${appConfig.PATH_PREFIX}/v1/webhooks/sslcommerz`;

type InitInput = {
  payment: Payment;
  plan: Plan;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
  };
};

const initSession = async (input: InitInput) => {
  ensureConfigured();

  const tran_id = input.payment.idempotency_key.slice(0, 30);
  // SSLCommerz expects amount in major units (decimal)
  const amount = (input.payment.amount / 100).toFixed(2);

  const params = new URLSearchParams({
    store_id: appConfig.SSLCOMMERZ.store_id,
    store_passwd: appConfig.SSLCOMMERZ.store_password,
    total_amount: amount,
    currency:
      input.payment.currency.toUpperCase() === "BDT" ? "BDT" : input.payment.currency.toUpperCase(),
    tran_id,
    success_url: `${apiBase()}/success`,
    fail_url: `${apiBase()}/fail`,
    cancel_url: `${apiBase()}/cancel`,
    ipn_url: `${apiBase()}/ipn`,
    shipping_method: "NO",
    product_name: input.plan.name,
    product_category: "Subscription",
    product_profile: "general",
    cus_name: input.customer.name || "Customer",
    cus_email: input.customer.email,
    cus_add1: "N/A",
    cus_city: "N/A",
    cus_country: "Bangladesh",
    cus_phone: input.customer.phone || "01700000000",
    value_a: input.payment.id,
    value_b: input.payment.shop_id,
    value_c: input.payment.plan_id,
  });

  const response = await fetch(`${baseUrl()}/gwprocess/v4/api.php`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = (await response.json()) as {
    status?: string;
    failedreason?: string;
    GatewayPageURL?: string;
    sessionkey?: string;
  };

  if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
    await PaymentRecordService.markFailed(input.payment.id, {
      failure_code: "sslcommerz_init_failed",
      failure_message: data.failedreason || "Failed to initialize SSLCommerz session",
      provider_payload: data as unknown as Prisma.InputJsonValue,
    });
    throw new ApiError(
      httpStatus.BAD_GATEWAY,
      "Failed to initialize SSLCommerz payment",
      data.failedreason || "SSLCommerz init failed",
    );
  }

  await prisma.payment.update({
    where: { id: input.payment.id },
    data: {
      provider_session_id: data.sessionkey || null,
      provider_transaction_id: tran_id,
      provider_payload: data as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    payment_id: input.payment.id,
    session_key: data.sessionkey,
    gateway_url: data.GatewayPageURL,
    provider: PaymentProvider.SSLCOMMERZ,
  };
};

const validateTransaction = async (val_id: string) => {
  ensureConfigured();
  const url = new URL(`${baseUrl()}/validator/api/validationserverAPI.php`);
  url.searchParams.set("val_id", val_id);
  url.searchParams.set("store_id", appConfig.SSLCOMMERZ.store_id);
  url.searchParams.set("store_passwd", appConfig.SSLCOMMERZ.store_password);
  url.searchParams.set("format", "json");

  const response = await fetch(url.toString());
  return (await response.json()) as Record<string, string>;
};

const processIpn = async (body: Record<string, string>) => {
  ensureConfigured();

  const val_id = body.val_id;
  const paymentId = body.value_a;
  const externalId = val_id || body.tran_id || `${Date.now()}`;

  const existingEvent = await prisma.paymentWebhookEvent.findUnique({
    where: { external_event_id: `sslcommerz:${externalId}` },
  });
  if (existingEvent?.processed) {
    return { received: true, duplicate: true };
  }

  if (!existingEvent) {
    await prisma.paymentWebhookEvent.create({
      data: {
        provider: PaymentProvider.SSLCOMMERZ,
        external_event_id: `sslcommerz:${externalId}`,
        event_type: body.status || "ipn",
        payload: body as unknown as Prisma.InputJsonValue,
      },
    });
  }

  try {
    if (!paymentId) {
      throw new Error("Missing payment id (value_a)");
    }

    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === PaymentStatus.SUCCEEDED) {
      await prisma.paymentWebhookEvent.update({
        where: { external_event_id: `sslcommerz:${externalId}` },
        data: { processed: true, processed_at: new Date() },
      });
      return { received: true, already_succeeded: true };
    }

    const status = (body.status || "").toUpperCase();
    const isSuccess = status === "VALID" || status === "VALIDATED";

    if (isSuccess && val_id) {
      const validated = await validateTransaction(val_id);
      const vStatus = (validated.status || "").toUpperCase();
      if (vStatus !== "VALID" && vStatus !== "VALIDATED") {
        await PaymentRecordService.markFailed(payment.id, {
          failure_code: validated.status,
          failure_message: "SSLCommerz validation failed",
          provider_payload: validated as unknown as Prisma.InputJsonValue,
          provider_transaction_id: body.tran_id || val_id,
        });
      } else {
        const activated = await SubscriptionActivationService.activateForShop({
          shop_id: payment.shop_id,
          plan_id: payment.plan_id,
          billing_interval: payment.billing_interval as BillingInterval,
          payment_provider: PaymentProvider.SSLCOMMERZ,
          shop_subscription_id: payment.shop_subscription_id,
        });

        await PaymentRecordService.markSucceeded(payment.id, {
          shop_subscription_id: activated.id,
          provider_transaction_id: body.tran_id || val_id,
          provider_payload: { body, validated } as unknown as Prisma.InputJsonValue,
          transaction_id: body.bank_tran_id || body.tran_id || null,
          manual_verify_status: ManualVerifyStatus.PENDING,
        });
      }
    } else {
      await PaymentRecordService.markFailed(payment.id, {
        failure_code: status || "FAILED",
        failure_message: body.error || body.failedreason || "SSLCommerz payment failed",
        provider_payload: body as unknown as Prisma.InputJsonValue,
        provider_transaction_id: body.tran_id || null,
      });
    }

    await prisma.paymentWebhookEvent.update({
      where: { external_event_id: `sslcommerz:${externalId}` },
      data: { processed: true, processed_at: new Date() },
    });

    return { received: true };
  } catch (error) {
    await prisma.paymentWebhookEvent.update({
      where: { external_event_id: `sslcommerz:${externalId}` },
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        retry_count: { increment: 1 },
        last_retried_at: new Date(),
      },
    });
    throw error;
  }
};

export const SslCommerzProvider = {
  initSession,
  processIpn,
  validateTransaction,
};
