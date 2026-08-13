import { SubscriptionStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";

const block = async (subscriptionId: string, reason: string, adminId?: string) => {
  const sub = await prisma.shopSubscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!sub) return null;

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.shopSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.BLOCKED,
        blocked_at: new Date(),
        blocked_reason: reason,
        blocked_by_admin_id: adminId ?? null,
      },
    });

    const shop = await tx.shop.findUnique({ where: { id: sub.shop_id } });
    if (shop?.active_subscription_id === subscriptionId) {
      await tx.shop.update({
        where: { id: sub.shop_id },
        data: { active_subscription_id: null },
      });
    }

    return result;
  });

  return updated;
};

const unblock = async (subscriptionId: string) => {
  const sub = await prisma.shopSubscription.findUnique({
    where: { id: subscriptionId },
  });
  if (!sub) return null;

  if (sub.status !== SubscriptionStatus.BLOCKED) {
    return sub;
  }

  const now = new Date();
  if (sub.current_period_end < now) {
    return { error: "period_ended" as const, subscription: sub };
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.shopSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: SubscriptionStatus.ACTIVE,
        blocked_at: null,
        blocked_reason: null,
        blocked_by_admin_id: null,
      },
    });

    await tx.shop.update({
      where: { id: sub.shop_id },
      data: { active_subscription_id: subscriptionId },
    });

    return result;
  });

  return { subscription: updated };
};

export const SubscriptionBlockService = {
  block,
  unblock,
};
