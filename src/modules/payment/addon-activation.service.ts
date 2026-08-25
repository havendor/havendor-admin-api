import {
  Addon,
  BillingInterval,
  PaymentProvider,
  SubscriptionStatus,
} from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import { invalidateShopEntitlements } from "../entitlement/entitlement.cache.js";
import { periodDates } from "./utils.js";

type ActivateInput = {
  shop_id: string;
  addon_id: string;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
  shop_addon_id?: string | null;
};

const activateForShop = async (input: ActivateInput) => {
  const periods = periodDates(input.billing_interval);

  const shopAddon = await prisma.$transaction(async (tx) => {
    if (input.shop_addon_id) {
      return tx.shopAddon.update({
        where: { id: input.shop_addon_id },
        data: {
          addon_id: input.addon_id,
          status: SubscriptionStatus.ACTIVE,
          billing_interval: input.billing_interval,
          current_period_start: periods.current_period_start,
          current_period_end: periods.current_period_end,
          payment_provider: input.payment_provider,
          blocked_at: null,
          blocked_reason: null,
          blocked_by_admin_id: null,
          canceled_at: null,
          deleted_at: null,
        },
      });
    }

    return tx.shopAddon.create({
      data: {
        shop_id: input.shop_id,
        addon_id: input.addon_id,
        status: SubscriptionStatus.ACTIVE,
        billing_interval: input.billing_interval,
        current_period_start: periods.current_period_start,
        current_period_end: periods.current_period_end,
        payment_provider: input.payment_provider,
      },
    });
  });

  await invalidateShopEntitlements(input.shop_id);
  return shopAddon;
};

const ensurePendingShopAddon = async (input: {
  shop_id: string;
  addon: Addon;
  billing_interval: BillingInterval;
  payment_provider: PaymentProvider;
}) => {
  const periods = periodDates(input.billing_interval);

  return prisma.shopAddon.create({
    data: {
      shop_id: input.shop_id,
      addon_id: input.addon.id,
      status: SubscriptionStatus.TRIALING,
      billing_interval: input.billing_interval,
      current_period_start: periods.current_period_start,
      current_period_end: periods.current_period_end,
      payment_provider: input.payment_provider,
    },
  });
};

export const AddonActivationService = {
  activateForShop,
  ensurePendingShopAddon,
};
