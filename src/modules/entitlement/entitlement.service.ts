import { FeatureType, SubscriptionStatus } from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import {
  getCachedShopEntitlements,
  invalidateShopEntitlements,
  setCachedShopEntitlements,
  type TShopEntitlements,
} from "./entitlement.cache.js";

const mergeFeature = (
  map: TShopEntitlements,
  key: string,
  type: FeatureType,
  enabled: boolean,
  limitValue: bigint | null,
) => {
  if (type === FeatureType.BOOLEAN) {
    map[key] = Boolean(map[key]) || enabled;
    return;
  }

  const current = map[key];
  if (limitValue == null) {
    map[key] = null;
    return;
  }
  if (current === null) return;
  const next = Number(limitValue);
  if (typeof current !== "number") {
    map[key] = next;
    return;
  }
  map[key] = Math.max(current, next);
};

const computeEntitlements = async (shopId: string): Promise<TShopEntitlements> => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, deleted_at: null },
    select: {
      active_subscription: {
        select: {
          status: true,
          deleted_at: true,
          plan: {
            select: {
              plan_features: {
                include: { feature: true },
              },
            },
          },
        },
      },
      shop_addons: {
        where: { status: SubscriptionStatus.ACTIVE, deleted_at: null },
        select: {
          addon: {
            select: {
              addon_features: {
                include: { feature: true },
              },
            },
          },
        },
      },
    },
  });

  const map: TShopEntitlements = {};
  const sub = shop?.active_subscription;
  if (sub && sub.status === SubscriptionStatus.ACTIVE && !sub.deleted_at) {
    for (const pf of sub.plan.plan_features) {
      if (pf.feature.deleted_at) continue;
      mergeFeature(map, pf.feature.key, pf.feature.type, pf.enabled, pf.limit_value);
    }
  }

  for (const shopAddon of shop?.shop_addons ?? []) {
    for (const af of shopAddon.addon.addon_features) {
      if (af.feature.deleted_at) continue;
      mergeFeature(map, af.feature.key, af.feature.type, af.enabled, af.limit_value);
    }
  }

  return map;
};

const getAll = async (shopId: string) => {
  const cached = await getCachedShopEntitlements(shopId);
  if (cached) return cached;
  const entitlements = await computeEntitlements(shopId);
  await setCachedShopEntitlements(shopId, entitlements);
  return entitlements;
};

const has = async (shopId: string, featureKey: string) => {
  const all = await getAll(shopId);
  const value = all[featureKey];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value > 0;
  if (value === null) return true;
  return false;
};

const getLimit = async (shopId: string, featureKey: string) => {
  const all = await getAll(shopId);
  const value = all[featureKey];
  if (value === null) return Number.POSITIVE_INFINITY;
  if (typeof value === "number") return value;
  return 0;
};

export const EntitlementService = {
  getAll,
  has,
  getLimit,
  invalidate: invalidateShopEntitlements,
};
