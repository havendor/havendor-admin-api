import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Plan, Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TPlanCreateInput, TPlanListQuery, TPlanUpdateInput } from "./plan.type.js";

type TSerializedPlan = Omit<Plan, "max_storage_bytes"> & {
  max_storage_bytes: string | null;
};

const serializePlan = (plan: Plan): TSerializedPlan => {
  return {
    ...plan,
    max_storage_bytes:
      typeof plan.max_storage_bytes === "bigint" ? plan.max_storage_bytes.toString() : null,
  };
};

const create = async (payload: TPlanCreateInput): Promise<TSerializedPlan> => {
  const existingSlug = await prisma.plan.findFirst({
    where: { slug: payload.slug, deleted_at: null },
  });
  if (existingSlug) {
    throw new ApiError(httpStatus.CONFLICT, "Plan with this slug already exists.");
  }

  const data: Prisma.PlanCreateInput = {
    ...payload,
    max_storage_bytes: payload.max_storage_bytes != null ? BigInt(payload.max_storage_bytes) : null,
  };

  const plan = await prisma.plan.create({ data });
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

  const { data, meta } = await dbQueryWithPagination<Plan>({
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
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      is_active: true,
      price_monthly: true,
      price_yearly: true,
      max_orders_per_month: true,
      max_storage_bytes: true,
      max_staff_accounts: true,
      max_custom_pages: true,
      can_use_custom_domain: true,
      can_setup_gtm: true,
      can_access_advanced_dash: true,
      can_use_webhooks: true,
      can_use_api: true,
      can_use_advanced_analytics: true,
      has_priority_support: true,
      created_at: true,
      updated_at: true,
    },
  });

  return {
    data: data.map(serializePlan),
    meta,
  };
};

const details = async (id: string) => {
  const plan = await prisma.plan.findFirst({
    where: { id, deleted_at: null },
    include: {
      _count: {
        select: {
          subscriptions: true,
          shopSubscriptions: true,
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

const update = async (id: string, payload: TPlanUpdateInput): Promise<TSerializedPlan> => {
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

  const updateData: Prisma.PlanUpdateInput = {
    ...payload,
    ...(payload.max_storage_bytes !== undefined
      ? {
          max_storage_bytes:
            payload.max_storage_bytes != null ? BigInt(payload.max_storage_bytes) : null,
        }
      : {}),
  };

  const updated = await prisma.plan.update({
    where: { id },
    data: updateData,
  });

  return serializePlan(updated);
};

const softDelete = async (id: string): Promise<TSerializedPlan> => {
  const existing = await prisma.plan.findFirst({
    where: { id, deleted_at: null },
    include: {
      _count: {
        select: { shopSubscriptions: true },
      },
    },
  });

  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  if (existing._count.shopSubscriptions > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete plan. It has ${existing._count.shopSubscriptions} active shop subscription(s).`,
    );
  }

  const deleted = await prisma.plan.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_active: false,
    },
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
