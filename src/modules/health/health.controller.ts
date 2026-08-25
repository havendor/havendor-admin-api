import { response } from "@havendor/server-core";
import httpStatus from "http-status";
import { APP_CONFIG } from "../../config/index.js";
import { catchAsync } from "../../middleware/index.js";

const checkHealth = catchAsync(async (_req, res) => {
  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Admin API service is operational",
    data: {
      status: "healthy",
      service: APP_CONFIG.SERVICE_NAME,
      timestamp: new Date().toISOString(),
    },
  });
});

export const HealthController = {
  checkHealth,
};
