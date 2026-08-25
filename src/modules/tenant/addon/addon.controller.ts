import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { TenantAddonService } from "./addon.service.js";

const listCatalog = catchAsync(async (_req, res) => {
  const data = await TenantAddonService.listCatalog();
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-ons fetched successfully",
    data,
  });
});

const listActive = catchAsync(async (req, res) => {
  const data = await TenantAddonService.listActiveForShop(
    req.tenant!.id,
    req.validated!.query.shop_id,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Active add-ons fetched successfully",
    data,
  });
});

const getAddonDetails = catchAsync(async (req, res) => {
  const data = await TenantAddonService.getAddonDetails(String(req.params.id));
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-on details fetched successfully",
    data,
  });
});

const checkout = catchAsync(async (req, res) => {
  const data = await TenantAddonService.checkout(req.tenant!.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-on checkout initiated successfully",
    data,
  });
});

export const TenantAddonController = { listCatalog, getAddonDetails, listActive, checkout };
