import { ApiError, response } from "@havendor/server-core";
import httpStatus from "http-status";
import { PlanSlug } from "../../../generated/prisma/index.js";
import { catchAsync } from "../../../middleware/index.js";
import { prisma } from "../../../utility/index.js";

const planSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  price_monthly: true,
  price_yearly: true,
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
};

const listActivePlans = catchAsync(async (_req, res) => {
  const plans = await prisma.plan.findMany({
    where: {
      is_active: true,
      deleted_at: null,
    },
    orderBy: { price_monthly: "asc" },
    select: planSelect,
  });

  const data = plans.map(({ plan_features, ...plan }) => ({
    ...plan,
    features: plan_features.map((pf) => ({
      feature_id: pf.feature.id,
      key: pf.feature.key,
      name: pf.feature.name,
      description: pf.feature.description,
      type: pf.feature.type,
      status: pf.feature.status,
      enabled: pf.enabled,
      limit_value: pf.limit_value == null ? null : pf.limit_value.toString(),
    })),
  }));

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plans fetched successfully",
    data,
  });
});

const getPlanDetails = catchAsync(async (req, res) => {
  const idParam = String(req.params.id);
  const isSlug = Object.values(PlanSlug).includes(idParam as PlanSlug);

  const plan = await prisma.plan.findFirst({
    where: {
      ...(isSlug ? { slug: idParam as PlanSlug } : { id: idParam }),
      is_active: true,
      deleted_at: null,
    },
    select: planSelect,
  });

  if (!plan) {
    throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");
  }

  const { plan_features, ...rest } = plan;
  const data = {
    ...rest,
    features: plan_features.map((pf) => ({
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

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plan details fetched successfully",
    data,
  });
});

export const TenantPlanController = {
  listActivePlans,
  getPlanDetails,
};
