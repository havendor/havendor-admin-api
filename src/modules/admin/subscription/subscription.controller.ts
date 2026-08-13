import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { catchAsync } from "../../../middleware/index.js";
import { AdminSubscriptionService } from "./subscription.service.js";

const list = catchAsync(async (req, res) => {
  const { data, meta } = await AdminSubscriptionService.list(req.validated?.query || {});
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Subscriptions fetched successfully",
    data,
    meta,
  });
});

const block = catchAsync(async (req, res) => {
  const data = await AdminSubscriptionService.block(
    req.validated!.params.id,
    req.validated!.body.reason,
    req.admin!.id,
  );
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Subscription blocked successfully",
    data,
  });
});

const unblock = catchAsync(async (req, res) => {
  const data = await AdminSubscriptionService.unblock(req.validated!.params.id);
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Subscription unblocked successfully",
    data,
  });
});

export const AdminSubscriptionController = {
  list,
  block,
  unblock,
};
