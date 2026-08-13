import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { TenantShopService } from "./tenantShop.service.js";

const create = catchAsync(async (req, res) => {
  const shop = await TenantShopService.createShop(req.tenant!.id, req.validated!.body);

  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Shop created successfully",
    data: shop,
  });
});

const update = catchAsync(async (req, res) => {
  const shop = await TenantShopService.updateShop(
    req.tenant!.id,
    req.validated!.params!.id,
    req.validated!.body,
  );

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop updated successfully",
    data: shop,
  });
});

const list = catchAsync(async (req, res) => {
  const shops = await TenantShopService.listShops(req.tenant!.id, req.validated!.query);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shops fetched successfully",
    data: shops,
  });
});

const single = catchAsync(async (req, res) => {
  const shop = await TenantShopService.getShopDetails(req.tenant!.id, req.validated!.params!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop details fetched successfully",
    data: shop,
  });
});

const remove = catchAsync(async (req, res) => {
  const shop = await TenantShopService.softDeleteShop(req.tenant!.id, req.validated!.params!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop deleted successfully",
    data: shop,
  });
});

export const TenantShopController = {
  create,
  update,
  list,
  single,
  remove,
};
