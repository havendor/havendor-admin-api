import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { DatabaseService } from "./database.service.js";

const create = catchAsync(async (req, res) => {
  const data = await DatabaseService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Database host created successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await DatabaseService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Database hosts fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await DatabaseService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Database host details fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await DatabaseService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Database host updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await DatabaseService.softDelete(req.validated!.params.id, req.admin!);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Database host deleted successfully",
    data,
  });
});

const toggleDrain = catchAsync(async (req, res) => {
  const data = await DatabaseService.toggleDrain(
    req.validated!.params.id,
    req.validated!.body.is_accepting_schemas,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: `Database schema acceptance updated to ${req.validated!.body.is_accepting_schemas}`,
    data,
  });
});

const setDefault = catchAsync(async (req, res) => {
  const data = await DatabaseService.setDefault(
    req.validated!.params.id,
    req.validated!.body.is_default,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Database default status updated successfully",
    data,
  });
});

export const DatabaseController = {
  create,
  list,
  single,
  update,
  softDelete,
  toggleDrain,
  setDefault,
};
