import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { ShopService } from "./shop.service.js";

const create = catchAsync(async (req, res) => {
  const data = await ShopService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Shop created successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await ShopService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shops fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await ShopService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop details fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await ShopService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await ShopService.softDelete(req.validated!.params.id, req.admin!);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop deleted successfully",
    data,
  });
});

const approve = catchAsync(async (req, res) => {
  const data = await ShopService.approve(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop approved successfully",
    data,
  });
});

const suspend = catchAsync(async (req, res) => {
  const data = await ShopService.suspend(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop suspended successfully",
    data,
  });
});

const restore = catchAsync(async (req, res) => {
  const data = await ShopService.restore(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop restored successfully",
    data,
  });
});

const queueDbMigration = catchAsync(async (req, res) => {
  const data = await ShopService.queueDbMigration(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop database migration queued successfully",
    data,
  });
});

const queueBulkDbMigration = catchAsync(async (req, res) => {
  const data = await ShopService.queueBulkDbMigration(req.validated?.body || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Bulk shop database migration queued successfully",
    data,
  });
});

export const ShopController = {
  create,
  list,
  single,
  update,
  softDelete,
  approve,
  suspend,
  restore,
  queueDbMigration,
  queueBulkDbMigration,
};
