import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { ShopDomainService } from "./shopDomain.service.js";

const create = catchAsync(async (req, res) => {
  const data = await ShopDomainService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Shop domain added successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await ShopDomainService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop domains fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await ShopDomainService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop domain details fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await ShopDomainService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop domain updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await ShopDomainService.softDelete(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Shop domain deleted successfully",
    data,
  });
});

const verifyDns = catchAsync(async (req, res) => {
  const data = await ShopDomainService.verifyDns(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Domain DNS verification executed",
    data,
  });
});

const setPrimary = catchAsync(async (req, res) => {
  const data = await ShopDomainService.setPrimary(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Domain set as primary domain for shop",
    data,
  });
});

const manageSsl = catchAsync(async (req, res) => {
  const data = await ShopDomainService.manageSsl(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Domain SSL configuration updated",
    data,
  });
});

export const ShopDomainController = {
  create,
  list,
  single,
  update,
  softDelete,
  verifyDns,
  setPrimary,
  manageSsl,
};
