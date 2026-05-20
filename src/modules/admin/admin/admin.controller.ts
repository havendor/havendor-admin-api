import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { AdminService } from "./admin.service.js";
import { TAdminListQuey } from "./admin.type.js";

const createAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.createIntoDB(req.validated!.body);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin created successfully",
    data: result,
  });
});

const updateAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.updateIntoDB(req.validated!.body, req.validated!.params.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin updated successfully",
    data: result,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.deleteFromDB(req.validated!.params.id, req.admin!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin deleted successfully",
    data: result,
  });
});

const readAllAdmins = catchAsync(async (req, res) => {
  const { data, meta } = await AdminService.readAllFromDB(req.validated!.query! as TAdminListQuey);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admins fetched successfully",
    data,
    meta,
  });
});

const getAdminOptions = catchAsync(async (_req, res) => {
  const result = await AdminService.getOptionsFromDB();

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin options fetched successfully",
    data: result,
  });
});

const getSingleAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.getSingleFromDB(req.validated!.params!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin fetched successfully",
    data: result,
  });
});

const resetPasswordAdmin = catchAsync(async (req, res) => {
  const result = await AdminService.resetPasswordIntoDB(req.validated!.params!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin password reset successfully",
    data: result,
  });
});

export const AdminController = {
  createAdmin,
  updateAdmin,
  deleteAdmin,
  readAllAdmins,
  getAdminOptions,
  getSingleAdmin,
  resetPasswordAdmin,
};
