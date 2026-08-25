import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TPlanCreateInput, TPlanListQuery, TPlanUpdateInput } from "./plan.type.js";

const planFeatureSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  is_active: true,
  price_monthly: true,
  price_yearly: true,
  created_at: true,
  updated_at: true,
  plan_features: {
    select: {
      enabled: true,
      limit_value: true,
      feature: {
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
          type: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.PlanSelect;

const serializePlan = <
  T extends {
    plan_features?: Array<{
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
  plan: T,
) => {
  const { plan_features, ...rest } = plan;
  return {
    ...rest,
    features: (plan_features ?? []).map((pf) => ({
      feature_id: pf.feature.id,
      key: pf.feature.key,
      name: pf.feature.name,
      description: pf.feature.description,
      type: pf.feature.type,
      status: pf.feature.status,
      enabled: pf.enabled,
      limit_value: pf.limit_value == null ? null : pf.limit_value.toString(),
    })),
  };
};

const syncPlanFeatures = async (
  tx: Prisma.TransactionClient,
  planId: string,
  features: Array<{ feature_id: string; enabled?: boolean; limit_value?: number | null }>,
) => {
  await tx.planFeature.deleteMany({ where: { plan_id: planId } });
  if (!features.length) return;
  await tx.planFeature.createMany({
    data: features.map((f) => ({
      plan_id: planId,
      feature_id: f.feature_id,
      enabled: f.enabled ?? true,
      limit_value: f.limit_value == null ? null : BigInt(f.limit_value),
    })),
  });
};

const create = async (payload: TPlanCreateInput) => {
  const existingSlug = await prisma.plan.findFirst({
    where: { slug: payload.slug, deleted_at: null },
  });
  if (existingSlug) {
    throw new ApiError(httpStatus.CONFLICT, "Plan with this slug already exists.");
  }

  const { features, ...planData } = payload;

  const plan = await prisma.$transaction(async (tx) => {
    const created = await tx.plan.create({ data: planData });
    if (features?.length) {
      await syncPlanFeatures(tx, created.id, features);
    }
    return tx.plan.findUniqueOrThrow({
      where: { id: created.id },
      select: planFeatureSelect,
    });
  });

  return serializePlan(plan);
};

const list = async (query: TPlanListQuery = {} as TPlanListQuery) => {
  const { search, slug, is_active, ...pagination } = query;

  const where: Prisma.PlanWhereInput = {
    deleted_at: null,
    ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    ...(slug ? { slug } : {}),
    ...(typeof is_active === "boolean" ? { is_active } : {}),
  };

  const { data, meta } = await dbQueryWithPagination({
    model: prisma.plan,
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
    select: planFeatureSelect,
  });

  return {
    data: data.map((p) => serializePlan(p as never)),
    meta,
  };
};

const details = async (id: string) => {
  const plan = await prisma.plan.findFirst({
    where: { id, deleted_at: null },
    select: {
      ...planFeatureSelect,
      _count: {
        select: {
          subscriptions: true,
          shop_subscriptions: true,
        },
      },
    },
  });

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  const { _count, ...rest } = plan;
  return {
    ...serializePlan(rest),
    _count,
  };
};

const update = async (id: string, payload: TPlanUpdateInput) => {
  const existing = await prisma.plan.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const conflict = await prisma.plan.findFirst({
      where: { slug: payload.slug, NOT: { id }, deleted_at: null },
    });
    if (conflict) {
      throw new ApiError(httpStatus.CONFLICT, "Plan with this slug already exists.");
    }
  }

  const { features, ...planData } = payload;

  const updated = await prisma.$transaction(async (tx) => {
    await tx.plan.update({
      where: { id },
      data: planData,
    });
    if (features) {
      await syncPlanFeatures(tx, id, features);
    }
    return tx.plan.findUniqueOrThrow({
      where: { id },
      select: planFeatureSelect,
    });
  });

  return serializePlan(updated);
};

const softDelete = async (id: string) => {
  const existing = await prisma.plan.findFirst({
    where: { id, deleted_at: null },
    select: {
      ...planFeatureSelect,
      _count: {
        select: { shop_subscriptions: true },
      },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  if (existing._count.shop_subscriptions > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete plan. It has ${existing._count.shop_subscriptions} active shop subscription(s).`,
    );
  }

  const deleted = await prisma.plan.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
    select: planFeatureSelect,
  });

  return serializePlan(deleted);
};

export const PlanService = {
  create,
  list,
  details,
  update,
  softDelete,
};
