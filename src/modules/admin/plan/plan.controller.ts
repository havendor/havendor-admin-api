import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { PlanService } from "./plan.service.js";

const create = catchAsync(async (req, res) => {
  const data = await PlanService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Plan created successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await PlanService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plans fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await PlanService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plan details fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await PlanService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plan updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await PlanService.softDelete(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Plan deleted successfully",
    data,
  });
});

export const PlanController = {
  create,
  list,
  single,
  update,
  softDelete,
};
