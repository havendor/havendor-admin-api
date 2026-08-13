import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { PaymentMethodService } from "./paymentMethod.service.js";

const create = catchAsync(async (req, res) => {
  const data = await PaymentMethodService.create(req.validated!.body);
  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Payment method created successfully",
    data,
  });
});

const list = catchAsync(async (req, res) => {
  const { data, meta } = await PaymentMethodService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment methods fetched successfully",
    data,
    meta,
  });
});

const single = catchAsync(async (req, res) => {
  const data = await PaymentMethodService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment method fetched successfully",
    data,
  });
});

const update = catchAsync(async (req, res) => {
  const data = await PaymentMethodService.update(req.validated!.params.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment method updated successfully",
    data,
  });
});

const softDelete = catchAsync(async (req, res) => {
  const data = await PaymentMethodService.softDelete(req.validated!.params.id, req.admin!);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment method deleted successfully",
    data,
  });
});

export const PaymentMethodController = {
  create,
  list,
  single,
  update,
  softDelete,
};
