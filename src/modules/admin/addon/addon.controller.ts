import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { AddonService } from "./addon.service.js";

const create = catchAsync(async (req, res) => {
  const data = await AddonService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Add-on created successfully",
    data,
  });
});
const list = catchAsync(async (req, res) => {
  const { data, meta } = await AddonService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-ons fetched successfully",
    data,
    meta,
  });
});
const single = catchAsync(async (req, res) => {
  const data = await AddonService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-on fetched successfully",
    data,
  });
});
const update = catchAsync(async (req, res) => {
  const data = await AddonService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-on updated successfully",
    data,
  });
});
const softDelete = catchAsync(async (req, res) => {
  const data = await AddonService.softDelete(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Add-on deleted successfully",
    data,
  });
});

export const AddonController = { create, list, single, update, softDelete };
