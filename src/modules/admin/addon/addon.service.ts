import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TAddonCreateInput, TAddonListQuery, TAddonUpdateInput } from "./addon.type.js";

const featureSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  is_active: true,
  price_monthly: true,
  price_yearly: true,
  created_at: true,
  updated_at: true,
  addon_features: {
    select: {
      enabled: true,
      limit_value: true,
      feature: {
        select: { id: true, key: true, name: true, description: true, type: true, status: true },
      },
    },
  },
} satisfies Prisma.AddonSelect;

const serialize = <
  T extends {
    addon_features?: Array<{
      enabled: boolean;
      limit_value: bigint | null;
      feature: {
        id: string;
        key: string;
        name: string;
        description: string | null;
        type: string;
        status: string;
      };
    }>;
  },
>(
  row: T,
) => {
  const { addon_features, ...rest } = row;
  return {
    ...rest,
    features: (addon_features ?? []).map((af) => ({
      feature_id: af.feature.id,
      key: af.feature.key,
      name: af.feature.name,
      description: af.feature.description,
      type: af.feature.type,
      status: af.feature.status,
      enabled: af.enabled,
      limit_value: af.limit_value == null ? null : af.limit_value.toString(),
    })),
  };
};

const syncFeatures = async (
  tx: Prisma.TransactionClient,
  addonId: string,
  features: Array<{ feature_id: string; enabled?: boolean; limit_value?: number | null }>,
) => {
  await tx.addonFeature.deleteMany({ where: { addon_id: addonId } });
  if (!features.length) return;
  await tx.addonFeature.createMany({
    data: features.map((f) => ({
      addon_id: addonId,
      feature_id: f.feature_id,
      enabled: f.enabled ?? true,
      limit_value: f.limit_value == null ? null : BigInt(f.limit_value),
    })),
  });
};

const create = async (payload: TAddonCreateInput) => {
  const exists = await prisma.addon.findFirst({ where: { slug: payload.slug, deleted_at: null } });
  if (exists) throw new ApiError(httpStatus.CONFLICT, "Add-on slug already exists.");
  const { features, ...data } = payload;
  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.addon.create({ data });
    if (features?.length) await syncFeatures(tx, created.id, features);
    return tx.addon.findUniqueOrThrow({ where: { id: created.id }, select: featureSelect });
  });
  return serialize(row);
};

const list = async (query: TAddonListQuery = {} as TAddonListQuery) => {
  const { search, is_active, ...pagination } = query;
  const where: Prisma.AddonWhereInput = {
    deleted_at: null,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(typeof is_active === "boolean" ? { is_active } : {}),
  };
  const { data, meta } = await dbQueryWithPagination({
    model: prisma.addon,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: [
      "created_at",
      "updated_at",
      "name",
      "price_monthly",
      "price_yearly",
      "is_active",
    ],
    select: featureSelect,
  });
  return { data: data.map((d) => serialize(d as never)), meta };
};

const details = async (id: string) => {
  const row = await prisma.addon.findFirst({
    where: { id, deleted_at: null },
    select: featureSelect,
  });
  if (!row) throw new ApiError(httpStatus.NOT_FOUND, "Add-on not found.");
  return serialize(row);
};

const update = async (id: string, payload: TAddonUpdateInput) => {
  const existing = await prisma.addon.findFirst({ where: { id, deleted_at: null } });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Add-on not found.");
  if (payload.slug && payload.slug !== existing.slug) {
    const conflict = await prisma.addon.findFirst({
      where: { slug: payload.slug, NOT: { id }, deleted_at: null },
    });
    if (conflict) throw new ApiError(httpStatus.CONFLICT, "Add-on slug already exists.");
  }
  const { features, ...data } = payload;
  const row = await prisma.$transaction(async (tx) => {
    await tx.addon.update({ where: { id }, data });
    if (features) await syncFeatures(tx, id, features);
    return tx.addon.findUniqueOrThrow({ where: { id }, select: featureSelect });
  });
  return serialize(row);
};

const softDelete = async (id: string) => {
  const existing = await prisma.addon.findFirst({
    where: { id, deleted_at: null },
    include: { _count: { select: { shop_addons: true } } },
  });
  if (!existing) throw new ApiError(httpStatus.NOT_FOUND, "Add-on not found.");
  if (existing._count.shop_addons > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete add-on with ${existing._count.shop_addons} shop purchase(s).`,
    );
  }
  const row = await prisma.addon.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false },
    select: featureSelect,
  });
  return serialize(row);
};

export const AddonService = { create, list, details, update, softDelete };
