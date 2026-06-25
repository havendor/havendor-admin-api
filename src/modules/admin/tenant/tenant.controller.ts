import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { TenantService } from "./tenant.service.js";

// Create Tenant
const createTenant = catchAsync(async (req, res) => {
  const result = await TenantService.createIntoDB(req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Tenant created successfully",
    data: result,
  });
});

// List Tenants
const readAllTenants = catchAsync(async (req, res) => {
  const { data, meta } = await TenantService.getAllFromDB(req.validated?.query);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Tenants fetched successfully",
    data,
    meta,
  });
});

// Get Single Tenant
const getSingleTenant = catchAsync(async (req, res) => {
  const result = await TenantService.getSingleFromDB(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Tenant fetched successfully",
    data: result,
  });
});

// Update Tenant
const updateTenant = catchAsync(async (req, res) => {
  const result = await TenantService.updateIntoDB(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Tenant updated successfully",
    data: result,
  });
});

// Delete (soft) Tenant
const deleteTenant = catchAsync(async (req, res) => {
  const result = await TenantService.deleteFromDB(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Tenant deleted successfully",
    data: result,
  });
});

export const TenantController = {
  createTenant,
  readAllTenants,
  getSingleTenant,
  updateTenant,
  deleteTenant,
};
