import { Logger, RedisClient } from "@havendor/server-core";

const key = (shopId: string) => `shop:${shopId}:entitlements`;

export type TShopEntitlements = Record<string, boolean | number | null>;

export const getCachedShopEntitlements = async (shopId: string) => {
  try {
    return await RedisClient.get<TShopEntitlements>(key(shopId));
  } catch {
    return null;
  }
};

export const setCachedShopEntitlements = async (
  shopId: string,
  entitlements: TShopEntitlements,
) => {
  try {
    await RedisClient.setEx(key(shopId), 10 * 60, entitlements);
  } catch (error) {
    Logger.app.warn("Failed to set entitlement cache", error);
  }
};

export const invalidateShopEntitlements = async (shopId: string) => {
  try {
    await RedisClient.del(key(shopId));
  } catch (error) {
    Logger.app.warn("Failed to invalidate entitlement cache", error);
  }
};
