import { ApiError, response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { prisma } from "../../../utility/index.js";
import { EntitlementService } from "../../entitlement/entitlement.service.js";

const getForShop = catchAsync(async (req, res) => {
  const shopId = req.validated!.query.shop_id as string;
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: req.tenant!.id, deleted_at: null },
    select: { id: true },
  });
  if (!shop) throw new ApiError(httpStatus.NOT_FOUND, "Shop not found");
  const data = await EntitlementService.getAll(shop.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Entitlements fetched successfully",
    data,
  });
});

export const TenantEntitlementController = { getForShop };
