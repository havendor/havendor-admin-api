import { RedisClient, response } from "@havendor/server-core";
import httpStatus from "http-status";
import { APP_CONFIG } from "../../../config/index.js";
import { catchAsync } from "../../../middleware/index.js";
import { prisma } from "../../../utility/index.js";

const getInternalHealth = catchAsync(async (_req, res) => {
  const startTime = Date.now();

  let dbHealthy: boolean;
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
    dbHealthy = true;
  } catch {
    dbHealthy = false;
  }

  let redisHealthy: boolean;
  try {
    await RedisClient.ping();
    redisHealthy = true;
  } catch {
    redisHealthy = false;
  }

  const overallHealthy = dbHealthy;
  const statusCode = overallHealthy ? httpStatus.OK : httpStatus.SERVICE_UNAVAILABLE;

  return response(res, {
    status_code: statusCode,
    success: overallHealthy,
    message: overallHealthy ? "Internal service is healthy" : "Internal service is degraded",
    data: {
      service: APP_CONFIG.SERVICE_NAME,
      environment: APP_CONFIG.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime_seconds: process.uptime(),
      latency_ms: Date.now() - startTime,
      dependencies: {
        database: {
          status: dbHealthy ? "UP" : "DOWN",
          latency_ms: dbLatencyMs,
        },
        redis: {
          status: redisHealthy ? "UP" : "DOWN",
        },
      },
    },
  });
});

export const InternalHealthController = {
  getInternalHealth,
};
