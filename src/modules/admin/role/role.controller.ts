import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware";
import { RoleService } from "./role.service";

const getRolePermission = catchAsync(async (_req, res) => {
  const result = await RoleService.getAllPermissionFromDB();

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Role permission fetched successfully",
    data: result,
  });
});

const create = catchAsync(async (req, res) => {
  const result = await RoleService.createIntoDB(req!.validated!.body, req.admin!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Role created successfully",
    data: result,
  });
});

const update = catchAsync(async (req, res) => {
  const { id } = req!.validated!.params;
  const result = await RoleService.updateIntoDB(id, req!.validated!.body);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Role updated successfully",
    data: result,
  });
});

const getAll = catchAsync(async (req, res) => {
  const result = await RoleService.getAllFromDB(req!.validated!.query);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Roles fetched successfully",
    ...result,
  });
});

const getSingle = catchAsync(async (req, res) => {
  const { id } = req!.validated!.params;
  const result = await RoleService.getSingleFromDB(id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Role fetched successfully",
    data: result,
  });
});

export const RoleController = {
  getRolePermission,
  create,
  update,
  getAll,
  getSingle,
};
