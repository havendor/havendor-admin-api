import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { prisma } from "../../../utility/index.js";

const listActivePlans = catchAsync(async (_req, res) => {
  const data = await prisma.plan.findMany({
    where: {
      is_active: true,
      deleted_at: null,
    },
    orderBy: { price_monthly: "asc" },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
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
    },
  });

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plans fetched successfully",
    data,
  });
});

export const TenantPlanController = {
  listActivePlans,
};
