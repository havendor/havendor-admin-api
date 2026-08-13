import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { AdminPaymentService } from "./payment.service.js";

const list = catchAsync(async (req, res) => {
  const { data, meta } = await AdminPaymentService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payments fetched successfully",
    data,
    meta,
  });
});

const details = catchAsync(async (req, res) => {
  const data = await AdminPaymentService.details(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment fetched successfully",
    data,
  });
});

const verify = catchAsync(async (req, res) => {
  const data = await AdminPaymentService.verify(
    req.validated!.params.id,
    req.admin!.id,
    req.validated!.body.notes,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment verified successfully",
    data,
  });
});

const reject = catchAsync(async (req, res) => {
  const data = await AdminPaymentService.reject(
    req.validated!.params.id,
    req.admin!.id,
    req.validated!.body.notes,
    req.validated!.body.block_subscription,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Payment rejected successfully",
    data,
  });
});

export const AdminPaymentController = {
  list,
  details,
  verify,
  reject,
};
