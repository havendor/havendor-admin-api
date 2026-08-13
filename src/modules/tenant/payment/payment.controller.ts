import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { TenantPaymentService } from "./payment.service.js";

const listMethods = catchAsync(async (_req, res) => {
  const data = await TenantPaymentService.listActiveMethods();
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment methods fetched successfully",
    data,
  });
});

const checkout = catchAsync(async (req, res) => {
  const data = await TenantPaymentService.checkout(req.tenant!.id, req.validated!.body);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Checkout initiated successfully",
    data,
  });
});

const listPayments = catchAsync(async (req, res) => {
  const { data, meta } = await TenantPaymentService.listPayments(
    req.tenant!.id,
    req.validated?.query || {},
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payments fetched successfully",
    data,
    meta,
  });
});

const paymentDetails = catchAsync(async (req, res) => {
  const data = await TenantPaymentService.paymentDetails(req.tenant!.id, req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment fetched successfully",
    data,
  });
});

const currentSubscription = catchAsync(async (req, res) => {
  const data = await TenantPaymentService.currentSubscription(
    req.tenant!.id,
    req.validated!.query.shop_id,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Subscription fetched successfully",
    data,
  });
});

export const TenantPaymentController = {
  listMethods,
  checkout,
  listPayments,
  paymentDetails,
  currentSubscription,
};
