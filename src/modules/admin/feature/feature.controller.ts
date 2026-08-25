import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { FeatureService } from "./feature.service.js";

const create = catchAsync(async (req, res) => {
  const data = await FeatureService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Feature created successfully",
    data,
  });
});
const list = catchAsync(async (req, res) => {
  const { data, meta } = await FeatureService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Features fetched successfully",
    data,
    meta,
  });
});
const single = catchAsync(async (req, res) => {
  const data = await FeatureService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Feature fetched successfully",
    data,
  });
});
const update = catchAsync(async (req, res) => {
  const data = await FeatureService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Feature updated successfully",
    data,
  });
});
const softDelete = catchAsync(async (req, res) => {
  const data = await FeatureService.softDelete(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Feature deleted successfully",
    data,
  });
});

export const FeatureController = { create, list, single, update, softDelete };
