import { Logger, RedisClient } from "@havendor/server-core";
import { Server } from "http";
import { createApp } from "./app.js";
import { APP_CONFIG } from "./config/index.js";
import { closeWorkers, initWorkers } from "./workers/index.js";

// Enable BigInt serialization for JSON.stringify (e.g. Prisma BigInt fields)
if (
  typeof BigInt !== "undefined" &&
  !(BigInt.prototype as unknown as { toJSON?: () => unknown }).toJSON
) {
  (BigInt.prototype as unknown as { toJSON: () => number | string }).toJSON = function (
    this: bigint,
  ): number | string {
    const num = Number(this);
    return Number.isSafeInteger(num) ? num : this.toString();
  };
}

const app = createApp();

const bootstrap = async () => {
  await RedisClient.connect();
  initWorkers();

  const server: Server = app.listen(APP_CONFIG.PORT, () => {
    Logger.app.info(`Running on '${APP_CONFIG.NODE_ENV}' environment!`);
    Logger.app.info(`Server is running at http://localhost:${APP_CONFIG.PORT}`);
  });

  const exitHandler = async (error: unknown, errorType: string) => {
    await closeWorkers().catch((err) => Logger.app.error("Error closing workers", err));
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

  process.on("SIGTERM", async () => {
    Logger.app.error("SIGTERM received");
    await closeWorkers().catch((err) => Logger.app.error("Error closing workers", err));
    if (server) {
      server.close();
    }
  });
};

bootstrap();
