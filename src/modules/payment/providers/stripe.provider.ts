import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import Stripe from "stripe";
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
import { periodDates } from "../utils.js";
import { getStripe } from "./stripe.client.js";

type CheckoutInput = {
  payment: Payment;
  plan: Plan;
  tenant: { id: string; email: string; first_name: string; last_name?: string | null };
  successUrl?: string;
  cancelUrl?: string;
};

const ensureStripeCustomer = async (tenant: CheckoutInput["tenant"]) => {
  const stripe = getStripe();
  if (!stripe) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe is not configured",
      "Missing STRIPE_SECRET_KEY",
    );
  }

  const existing = await prisma.stripeCustomer.findUnique({
    where: { tenant_id: tenant.id },
  });
  if (existing) return { local: existing, stripe };

  const customer = await stripe.customers.create({
    email: tenant.email,
    name: [tenant.first_name, tenant.last_name].filter(Boolean).join(" ") || undefined,
    metadata: { tenant_id: tenant.id },
  });

  const local = await prisma.stripeCustomer.create({
    data: {
      tenant_id: tenant.id,
      stripe_customer_id: customer.id,
      email: tenant.email,
      name: customer.name,
    },
  });

  return { local, stripe };
};

const createCheckoutSession = async (input: CheckoutInput) => {
  const { local, stripe } = await ensureStripeCustomer(input.tenant);
  const amount = input.payment.amount;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: local.stripe_customer_id,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.payment.currency,
          unit_amount: amount,
          product_data: {
            name: `${input.plan.name} (${input.payment.billing_interval})`,
            description: input.plan.description || undefined,
          },
        },
      },
    ],
    metadata: {
      payment_id: input.payment.id,
      shop_id: input.payment.shop_id,
      plan_id: input.payment.plan_id,
      tenant_id: input.payment.tenant_id,
    },
    success_url:
      input.successUrl ||
      `${appConfig.TENANT_FRONTEND_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url:
      input.cancelUrl ||
      `${appConfig.TENANT_FRONTEND_URL}/billing/cancel?payment_id=${input.payment.id}`,
  });

  await prisma.payment.update({
    where: { id: input.payment.id },
    data: {
      provider_session_id: session.id,
      provider_payload: session as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    payment_id: input.payment.id,
    session_id: session.id,
    checkout_url: session.url,
    provider: PaymentProvider.STRIPE,
  };
};

const handleWebhook = async (rawBody: Buffer, signature: string) => {
  const stripe = getStripe();
  if (!stripe || !appConfig.STRIPE.webhook_secret) {
    throw new ApiError(
      httpStatus.SERVICE_UNAVAILABLE,
      "Stripe webhook is not configured",
      "Missing Stripe secrets",
    );
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, appConfig.STRIPE.webhook_secret);
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Stripe signature");
  }

  const existing = await prisma.stripeWebhookEvent.findUnique({
    where: { stripe_event_id: event.id },
  });
  if (existing?.processed) {
    return { received: true, duplicate: true };
  }

  if (!existing) {
    await prisma.stripeWebhookEvent.create({
      data: {
        stripe_event_id: event.id,
        event_type: event.type,
        api_version: event.api_version,
        payload: event as unknown as Prisma.InputJsonValue,
      },
    });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentId = session.metadata?.payment_id;
      if (paymentId) {
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (payment && payment.status !== PaymentStatus.SUCCEEDED) {
          const activated = await SubscriptionActivationService.activateForShop({
            shop_id: payment.shop_id,
            plan_id: payment.plan_id,
            billing_interval: payment.billing_interval as BillingInterval,
            payment_provider: PaymentProvider.STRIPE,
            shop_subscription_id: payment.shop_subscription_id,
          });

          await PaymentRecordService.markSucceeded(payment.id, {
            shop_subscription_id: activated.id,
            provider_session_id: session.id,
            provider_transaction_id:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || session.id,
            provider_payload: session as unknown as Prisma.InputJsonValue,
            manual_verify_status: ManualVerifyStatus.PENDING,
          });
        }
      }
    }

    if (
      event.type === "checkout.session.expired" ||
      event.type === "payment_intent.payment_failed"
    ) {
      const obj = event.data.object as { metadata?: { payment_id?: string }; id: string };
      const paymentId = obj.metadata?.payment_id;
      if (paymentId) {
        await PaymentRecordService.markFailed(paymentId, {
          failure_code: event.type,
          failure_message: "Payment failed or session expired",
          provider_payload: event.data.object as unknown as Prisma.InputJsonValue,
          provider_transaction_id: obj.id,
        });
      }
    }

    await prisma.stripeWebhookEvent.update({
      where: { stripe_event_id: event.id },
      data: { processed: true, processed_at: new Date() },
    });
  } catch (error) {
    await prisma.stripeWebhookEvent.update({
      where: { stripe_event_id: event.id },
      data: {
        error: error instanceof Error ? error.message : "Unknown error",
        retry_count: { increment: 1 },
        last_retried_at: new Date(),
      },
    });
    throw error;
  }

  return { received: true };
};

export const StripeProvider = {
  createCheckoutSession,
  handleWebhook,
  periodDates,
};
