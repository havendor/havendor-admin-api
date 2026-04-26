import { globalErrorHandler, notFoundHandler, userAgent, userIp } from "@havendor/server-core";
import compression from "compression";
import cookieParser from "cookie-parser";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { appConfig } from "./config";
import { enableCors } from "./middleware";
import { adminRoutes, internalRoutes, tenantRoutes } from "./routes";

export const createApp = (): Application => {
  const app: Application = express();

  if (appConfig.NODE_ENV === "production") app.set("trust proxy", 1);

  const bodyLimit = "5mb";

  // Middlewares
  app.use(enableCors());
  app.use(cookieParser());
  app.use(helmet());
  app.use(compression());
  app.use(userIp());
  app.use(userAgent());
  app.use(express.json({ limit: bodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
  app.use(morgan(appConfig.NODE_ENV === "production" ? "combined" : "dev"));

  // Root route
  app.get(`${appConfig.PATH_PREFIX}`, (_req, res) => {
    res.redirect("/");
  });

  // Admin routes
  app.use(adminRoutes);

  // Internal routes
  app.use(internalRoutes);

  // Tenant routes
  app.use(tenantRoutes);

  // Not found handler
  app.use(notFoundHandler);

  // Error handler
  app.use(globalErrorHandler());

  return app;
};
