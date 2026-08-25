import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import { SubscriptionStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import { invalidateShopEntitlements } from "../entitlement/entitlement.cache.js";

const block = async (shopAddonId: string, adminId: string, reason?: string | null) => {
  const shopAddon = await prisma.shopAddon.findUnique({ where: { id: shopAddonId } });
  if (!shopAddon || shopAddon.deleted_at) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop add-on not found");
  }

  const updated = await prisma.shopAddon.update({
    where: { id: shopAddonId },
    data: {
      status: SubscriptionStatus.BLOCKED,
      blocked_at: new Date(),
      blocked_reason: reason ?? null,
      blocked_by_admin_id: adminId,
    },
  });

  await invalidateShopEntitlements(shopAddon.shop_id);
  return updated;
};

const unblock = async (shopAddonId: string) => {
  const shopAddon = await prisma.shopAddon.findUnique({ where: { id: shopAddonId } });
  if (!shopAddon || shopAddon.deleted_at) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop add-on not found");
  }
  if (shopAddon.status !== SubscriptionStatus.BLOCKED) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Shop add-on is not blocked");
  }

  const updated = await prisma.shopAddon.update({
    where: { id: shopAddonId },
    data: {
      status: SubscriptionStatus.ACTIVE,
      blocked_at: null,
      blocked_reason: null,
      blocked_by_admin_id: null,
    },
  });

  await invalidateShopEntitlements(shopAddon.shop_id);
  return updated;
};

export const AddonBlockService = { block, unblock };
