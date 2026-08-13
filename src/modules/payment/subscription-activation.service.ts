import {
  BillingInterval,
  PaymentProvider,
  Plan,
  SubscriptionStatus,
} from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import { periodDates } from "./utils.js";

type ActivateInput = {
  shop_id: string;
  plan_id: string;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
  shop_subscription_id?: string | null;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
};

const activateForShop = async (input: ActivateInput) => {
  const periods = periodDates(input.billing_interval);

  return prisma.$transaction(async (tx) => {
    let subscription;

    if (input.shop_subscription_id) {
      subscription = await tx.shopSubscription.update({
        where: { id: input.shop_subscription_id },
        data: {
          plan_id: input.plan_id,
          status: SubscriptionStatus.ACTIVE,
          billing_interval: input.billing_interval,
          current_period_start: periods.current_period_start,
          current_period_end: periods.current_period_end,
          payment_provider: input.payment_provider,
          stripe_subscription_id: input.stripe_subscription_id ?? undefined,
          stripe_price_id: input.stripe_price_id ?? undefined,
          blocked_at: null,
          blocked_reason: null,
          blocked_by_admin_id: null,
          canceled_at: null,
          deleted_at: null,
        },
      });
    } else {
      subscription = await tx.shopSubscription.create({
        data: {
          shop_id: input.shop_id,
          plan_id: input.plan_id,
          status: SubscriptionStatus.ACTIVE,
          billing_interval: input.billing_interval,
          current_period_start: periods.current_period_start,
          current_period_end: periods.current_period_end,
          payment_provider: input.payment_provider,
          stripe_subscription_id: input.stripe_subscription_id ?? null,
          stripe_price_id: input.stripe_price_id ?? null,
        },
      });
    }

    await tx.shop.update({
      where: { id: input.shop_id },
      data: { active_subscription_id: subscription.id },
    });

    return subscription;
  });
};

const ensurePendingSubscription = async (input: {
  shop_id: string;
  plan: Plan;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
}) => {
  const periods = periodDates(input.billing_interval);

  return prisma.shopSubscription.create({
    data: {
      shop_id: input.shop_id,
      plan_id: input.plan.id,
      status: SubscriptionStatus.TRIALING,
      billing_interval: input.billing_interval,
      current_period_start: periods.current_period_start,
      current_period_end: periods.current_period_end,
      payment_provider: input.payment_provider,
    },
  });
};

export const SubscriptionActivationService = {
  activateForShop,
  ensurePendingSubscription,
};
