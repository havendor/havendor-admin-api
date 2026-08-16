import { globalErrorHandler, notFoundHandler, userAgent, userIp } from "@havendor/server-core";
import compression from "compression";
import timeout from "connect-timeout";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import helmet from "helmet";
import hpp from "hpp";
import morgan from "morgan";
import { APP_CONFIG } from "./config/index.js";
import { enableCors } from "./middleware/index.js";
import { stripeWebhookHandler, WebhookRoutes } from "./modules/webhooks/webhook.route.js";
import { adminRoutes, internalRoutes, tenantRoutes } from "./routes/index.js";

import "./const/permissions.js";

export const createApp = (): Application => {
  const app: Application = express();

  if (APP_CONFIG.NODE_ENV === "production") app.set("trust proxy", 1);
  app.disable("x-powered-by");

  const defaultBodyLimit = "1mb";

  // Middlewares
  app.use(timeout("15s"));
  app.use(enableCors());
  app.use(cookieParser());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(
    compression({
      threshold: 1024,
      level: 6,
    }),
  );
  app.use(hpp());
  app.use(userIp());
  app.use(userAgent());

  // Stripe webhook needs raw body — mount before JSON parser
  app.post(
    `${APP_CONFIG.PATH_PREFIX}/v1/webhooks/stripe`,
    express.raw({ type: "application/json", limit: "5mb" }),
    stripeWebhookHandler,
  );

  app.use(express.json({ limit: defaultBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: defaultBodyLimit }));
  app.use(morgan(APP_CONFIG.NODE_ENV === "production" ? "combined" : "dev"));

  // SSLCommerz IPN + return URLs
  app.use(`${APP_CONFIG.PATH_PREFIX}/v1/webhooks`, WebhookRoutes);

  // Root route
  app.get(`${APP_CONFIG.PATH_PREFIX}`, (_req, res) => {
    res.redirect("/");
  });

  // Health check
  app.get(`${APP_CONFIG.PATH_PREFIX}/health`, (_req, res) => {
    res.status(200).json({
      status: "ok",
      message: "OK",
      timestamp: new Date().toISOString(),
    });
  });

  // Admin routes
  app.use(`${APP_CONFIG.PATH_PREFIX}/v1/admin`, adminRoutes);

  // Internal routes
  app.use(`${APP_CONFIG.PATH_PREFIX}/v1/internal`, internalRoutes);

  // Tenant routes
  app.use(`${APP_CONFIG.PATH_PREFIX}/v1/tenant`, tenantRoutes);

  // Not found handler
  app.use(notFoundHandler);

  // Error handler
  app.use(globalErrorHandler());

  return app;
};
