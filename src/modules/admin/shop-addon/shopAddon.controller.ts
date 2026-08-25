import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { ShopAddonService } from "./shopAddon.service.js";

const list = catchAsync(async (req, res) => {
  const { data, meta } = await ShopAddonService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop add-ons fetched successfully",
    data,
    meta,
  });
});
const single = catchAsync(async (req, res) => {
  const data = await ShopAddonService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop add-on fetched successfully",
    data,
  });
});
const block = catchAsync(async (req, res) => {
  const data = await ShopAddonService.block(
    req.validated!.params.id,
    req.admin!.id,
    req.validated!.body.reason,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop add-on blocked successfully",
    data,
  });
});
const unblock = catchAsync(async (req, res) => {
  const data = await ShopAddonService.unblock(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop add-on unblocked successfully",
    data,
  });
});

export const ShopAddonController = { list, single, block, unblock };
