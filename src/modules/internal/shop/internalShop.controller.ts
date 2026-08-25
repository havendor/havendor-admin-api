import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { InternalShopService } from "./internalShop.service.js";

const resolveByDomain = catchAsync(async (req, res) => {
  const domain = String(req.query.domain || req.params.domain || "");
  const data = await InternalShopService.resolveByDomain(domain);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop domain resolved successfully",
    data,
  });
});

const getByIdOrIdentity = catchAsync(async (req, res) => {
  const idOrIdentity = String(req.params.idOrIdentity || "");
  const data = await InternalShopService.getByIdOrIdentity(idOrIdentity);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop details fetched successfully",
    data,
  });
});

const getDatabaseInfo = catchAsync(async (req, res) => {
  const target = String(req.params.domain || req.params.idOrIdentity || req.query.domain || "");
  const data = await InternalShopService.getDatabaseInfo(target);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop database information fetched successfully",
    data,
  });
});

const getSubscriptionInfo = catchAsync(async (req, res) => {
  const target = String(req.params.domain || req.params.idOrIdentity || req.query.domain || "");
  const data = await InternalShopService.getSubscriptionInfo(target);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop subscription and plan details fetched successfully",
    data,
  });
});

const getEntitlements = catchAsync(async (req, res) => {
  const target = String(req.params.domain || req.params.idOrIdentity || req.query.domain || "");
  const data = await InternalShopService.getEntitlements(target);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop entitlements fetched successfully",
    data,
  });
});

export const InternalShopController = {
  resolveByDomain,
  getByIdOrIdentity,
  getDatabaseInfo,
  getSubscriptionInfo,
  getEntitlements,
};
