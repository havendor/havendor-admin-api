import { Logger } from "@havendor/server-core";
import { tenantDbMigrationWorker } from "./tenantDbMigration.worker.js";

export * from "./tenantDbMigration.worker.js";

export const initWorkers = (): void => {
  Logger.app.info("Background workers initialized.");
};

export const closeWorkers = async (): Promise<void> => {
  Logger.app.info("Shutting down background workers...");
  await Promise.allSettled([tenantDbMigrationWorker.close()]);
  Logger.app.info("Background workers shut down successfully.");
};
