import { Logger, RedisClient } from "@havendor/server-core";
import { Server } from "http";
import { createApp } from "./app.js";
import { APP_CONFIG } from "./config/index.js";
const app = createApp();

const bootstrap = async () => {
  await RedisClient.connect();

  const server: Server = app.listen(APP_CONFIG.PORT, () => {
    Logger.app.info(`Running on '${APP_CONFIG.NODE_ENV}' environment!`);
    Logger.app.info(`Server is running at http://localhost:${APP_CONFIG.PORT}`);
  });

  const exitHandler = (error: unknown, errorType: string) => {
    if (server) {
      server.close(() => {
        Logger.app.error(errorType, error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  };

  const unexpectedErrorHandler = (error: unknown, errorType: string) => {
    Logger.app.error(error);
    exitHandler(error, errorType);
  };

  const uncaughtException = (error: unknown) => unexpectedErrorHandler(error, "Uncaught exception");

  const unhandledRejection = (error: unknown) =>
    unexpectedErrorHandler(error, "Unhandled rejection");

  process.on("uncaughtException", uncaughtException);
  process.on("unhandledRejection", unhandledRejection);

  process.on("SIGTERM", () => {
    Logger.app.error("SIGTERM received");
    if (server) {
      server.close();
    }
  });
};

bootstrap();
