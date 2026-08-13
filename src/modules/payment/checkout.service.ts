import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import {
  BillingInterval,
  ManualVerifyStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import { PaymentRecordService } from "./payment-record.service.js";
import { TPaymentInfoSubmit, TPaymentRequiredInput } from "./payment.types.js";
import { SslCommerzProvider } from "./providers/sslcommerz.provider.js";
import { StripeProvider } from "./providers/stripe.provider.js";
import { SubscriptionActivationService } from "./subscription-activation.service.js";
import {
  buildIdempotencyKey,
  currencyForProvider,
  extractTransactionId,
  isFreePlan,
  planAmount,
  validatePaymentInfo,
} from "./utils.js";

type CheckoutBody = {
  method_id: string;
  shop_id: string;
  plan_id: string;
  billing_interval: BillingInterval;
  payment_info?: TPaymentInfoSubmit[] | null;
  amount?: number | null;
};

const resolveActiveMethod = async (methodId: string) => {
  const method = await prisma.paymentMethod.findFirst({
    where: {
      id: methodId,
      status: "ACTIVE",
      deleted_at: null,
    },
  });
  if (!method) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Payment method is not available",
      "Method not found or inactive",
    );
  }
  return method;
};

const resolveShopForTenant = async (shopId: string, tenantId: string) => {
  const shop = await prisma.shop.findFirst({
    where: {
      id: shopId,
      tenant_id: tenantId,
      deleted_at: null,
    },
  });
  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found", "Shop not found");
  }
  return shop;
};

const resolvePlan = async (planId: string) => {
  const plan = await prisma.plan.findFirst({
    where: {
      id: planId,
      is_active: true,
      deleted_at: null,
    },
  });
  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found", "Plan not found");
  }
  return plan;
};

const checkout = async (tenantId: string, body: CheckoutBody) => {
  const method = await resolveActiveMethod(body.method_id);
  const shop = await resolveShopForTenant(body.shop_id, tenantId);
  const plan = await resolvePlan(body.plan_id);
  const amount = planAmount(plan, body.billing_interval);
  const currency = currencyForProvider(method.provider);

  // Free plan — activate immediately
  if (isFreePlan(plan) || amount === 0) {
    const freeMethod =
      method.provider === PaymentProvider.MANUAL
        ? method
        : (await prisma.paymentMethod.findFirst({
            where: {
              provider: PaymentProvider.MANUAL,
              status: "ACTIVE",
              deleted_at: null,
            },
          })) || method;

    const idempotency_key = buildIdempotencyKey([
      "free",
      tenantId,
      shop.id,
      plan.id,
      body.billing_interval,
      String(Date.now()),
    ]);

    const activated = await SubscriptionActivationService.activateForShop({
      shop_id: shop.id,
      plan_id: plan.id,
      billing_interval: body.billing_interval,
      payment_provider: freeMethod.provider,
    });

    const payment = await PaymentRecordService.createPending({
      tenant_id: tenantId,
      shop_id: shop.id,
      plan_id: plan.id,
      method_id: freeMethod.id,
      provider: freeMethod.provider,
      amount: 0,
      currency,
      billing_interval: body.billing_interval,
      idempotency_key,
      shop_subscription_id: activated.id,
      status: PaymentStatus.SUCCEEDED,
      manual_verify_status: ManualVerifyStatus.VERIFIED,
      paid_at: new Date(),
    });

    return {
      type: "free" as const,
      payment,
      subscription: activated,
    };
  }

  if (method.provider === PaymentProvider.MANUAL) {
    let snapshot;
    try {
      snapshot = validatePaymentInfo(
        method.required_inputs as TPaymentRequiredInput[] | null,
        body.payment_info,
      );
    } catch (error) {
      const fieldErrors = (error as { fieldErrors?: Record<string, string[]> }).fieldErrors;
      throw new ApiError(
        httpStatus.UNPROCESSABLE_ENTITY,
        "Invalid payment info",
        null,
        fieldErrors || null,
      );
    }

    const trx = extractTransactionId(snapshot);
    if (trx) {
      const dup = await prisma.payment.findFirst({
        where: {
          provider: PaymentProvider.MANUAL,
          transaction_id: trx,
          status: { in: [PaymentStatus.PENDING, PaymentStatus.SUCCEEDED] },
        },
      });
      if (dup) {
        throw new ApiError(httpStatus.CONFLICT, "Transaction already submitted", null, {
          transaction_id: ["This transaction ID was already used."],
        });
      }
    }

    const pendingSub = await SubscriptionActivationService.ensurePendingSubscription({
      shop_id: shop.id,
      plan,
      billing_interval: body.billing_interval,
      payment_provider: PaymentProvider.MANUAL,
    });

    const idempotency_key = buildIdempotencyKey([
      "manual",
      tenantId,
      shop.id,
      plan.id,
      method.id,
      trx || randomPart(),
      String(Date.now()),
    ]);

    const payment = await PaymentRecordService.createPending({
      tenant_id: tenantId,
      shop_id: shop.id,
      plan_id: plan.id,
      method_id: method.id,
      provider: PaymentProvider.MANUAL,
      amount: body.amount ?? amount,
      currency: "bdt",
      billing_interval: body.billing_interval,
      idempotency_key,
      shop_subscription_id: pendingSub.id,
      payment_info: snapshot,
      transaction_id: trx,
    });

    return {
      type: "manual" as const,
      payment,
      message: "Payment submitted. Awaiting admin verification.",
    };
  }

  // Automated
  const pendingSub = await SubscriptionActivationService.ensurePendingSubscription({
    shop_id: shop.id,
    plan,
    billing_interval: body.billing_interval,
    payment_provider: method.provider,
  });

  const idempotency_key = buildIdempotencyKey([
    method.provider,
    tenantId,
    shop.id,
    plan.id,
    body.billing_interval,
    String(Date.now()),
  ]);

  const payment = await PaymentRecordService.createPending({
    tenant_id: tenantId,
    shop_id: shop.id,
    plan_id: plan.id,
    method_id: method.id,
    provider: method.provider,
    amount,
    currency,
    billing_interval: body.billing_interval,
    idempotency_key,
    shop_subscription_id: pendingSub.id,
  });

  const tenant = await prisma.tenant.findUniqueOrThrow({ where: { id: tenantId } });

  if (method.provider === PaymentProvider.STRIPE) {
    const result = await StripeProvider.createCheckoutSession({
      payment,
      plan,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        first_name: tenant.first_name,
        last_name: tenant.last_name,
      },
    });
    return { type: "stripe" as const, ...result, payment_id: payment.id };
  }

  if (method.provider === PaymentProvider.SSLCOMMERZ) {
    const result = await SslCommerzProvider.initSession({
      payment,
      plan,
      customer: {
        name: [tenant.first_name, tenant.last_name].filter(Boolean).join(" "),
        email: tenant.email,
        phone: tenant.mobile,
      },
    });
    return { type: "sslcommerz" as const, ...result, payment_id: payment.id };
  }

  throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported payment provider");
};

const randomPart = () => Math.random().toString(36).slice(2, 10);

export const CheckoutService = {
  checkout,
};
