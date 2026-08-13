import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { ServerService } from "./server.service.js";

const create = catchAsync(async (req, res) => {
  const data = await ServerService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Server created successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await ServerService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Servers fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await ServerService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Server details fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await ServerService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Server updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await ServerService.softDelete(req.validated!.params.id, req.admin!);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Server deleted successfully",
    data,
  });
});

const toggleDrain = catchAsync(async (req, res) => {
  const data = await ServerService.toggleDrain(
    req.validated!.params.id,
    req.validated!.body.is_accepting_shops,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: `Server shop acceptance updated to ${req.validated!.body.is_accepting_shops}`,
    data,
  });
});

const setDefault = catchAsync(async (req, res) => {
  const data = await ServerService.setDefault(
    req.validated!.params.id,
    req.validated!.body.is_default_for_location,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Server location default status updated successfully",
    data,
  });
});

export const ServerController = {
  create,
  list,
  single,
  update,
  softDelete,
  toggleDrain,
  setDefault,
};
