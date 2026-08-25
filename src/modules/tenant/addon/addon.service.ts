import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import { SubscriptionStatus } from "../../../generated/prisma/index.js";
import { prisma } from "../../../utility/index.js";
import { CheckoutService } from "../../payment/checkout.service.js";

const listCatalog = async () => {
  const addons = await prisma.addon.findMany({
    where: { is_active: true, deleted_at: null },
    orderBy: { price_monthly: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price_monthly: true,
      price_yearly: true,
      addon_features: {
        select: {
          enabled: true,
          limit_value: true,
          feature: { select: { id: true, key: true, name: true, description: true, type: true } },
        },
      },
    },
  });
  return addons.map(({ addon_features, ...addon }) => ({
    ...addon,
    features: addon_features.map((af) => ({
      feature_id: af.feature.id,
      key: af.feature.key,
      name: af.feature.name,
      description: af.feature.description,
      type: af.feature.type,
      enabled: af.enabled,
      limit_value: af.limit_value == null ? null : af.limit_value.toString(),
    })),
  }));
};

const listActiveForShop = async (tenantId: string, shopId: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: tenantId, deleted_at: null },
  });
  if (!shop) throw new ApiError(httpStatus.NOT_FOUND, "Shop not found");

  return prisma.shopAddon.findMany({
    where: { shop_id: shopId, status: SubscriptionStatus.ACTIVE, deleted_at: null },
    include: {
      addon: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          price_monthly: true,
          price_yearly: true,
        },
      },
    },
    orderBy: { created_at: "desc" },
  });
};

const getAddonDetails = async (idOrSlug: string) => {
  const addon = await prisma.addon.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      is_active: true,
      deleted_at: null,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      price_monthly: true,
      price_yearly: true,
      addon_features: {
        select: {
          enabled: true,
          limit_value: true,
          feature: { select: { id: true, key: true, name: true, description: true, type: true } },
        },
      },
    },
  });

  if (!addon) {
    throw new ApiError(httpStatus.NOT_FOUND, "Add-on not found");
  }

  const { addon_features, ...rest } = addon;
  return {
    ...rest,
    features: addon_features.map((af) => ({
      feature_id: af.feature.id,
      key: af.feature.key,
      name: af.feature.name,
      description: af.feature.description,
      type: af.feature.type,
      enabled: af.enabled,
      limit_value: af.limit_value == null ? null : af.limit_value.toString(),
    })),
  };
};

const checkout = async (
  tenantId: string,
  body: {
    method_id: string;
    shop_id: string;
    addon_id: string;
    billing_interval: "MONTHLY" | "YEARLY";
    payment_info?: { hash: string; value?: string | null }[] | null;
    amount?: number | null;
  },
) => CheckoutService.checkoutAddon(tenantId, body);

export const TenantAddonService = {
  listCatalog,
  getAddonDetails,
  listActiveForShop,
  checkout,
};
