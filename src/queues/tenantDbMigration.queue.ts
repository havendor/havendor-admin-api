import { Logger, redisQueueConnection } from "@havendor/server-core";
import { JobsOptions, Queue } from "bullmq";
import {
  QUEUE_NAME,
  TENANT_DB_MIGRATION_JOB,
  TTenantDbBulkMigrationJobData,
  TTenantDbMigrationJobData,
} from "../const/index.js";
import { prisma } from "../utility/index.js";

export const tenantDbMigrationQueue = new Queue<
  TTenantDbMigrationJobData | TTenantDbBulkMigrationJobData
>(QUEUE_NAME.TENANT_DB_MIGRATION, {
  connection: redisQueueConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      count: 1000,
    },
    removeOnFail: {
      count: 2000,
    },
  },
});

tenantDbMigrationQueue.on("error", (err) => {
  Logger.job.error("Tenant DB Migration Queue Redis error:", err);
});

/**
 * Enqueue a single shop database migration job
 */
export const addTenantDbMigrationJob = async (
  data: TTenantDbMigrationJobData,
  opts?: JobsOptions,
) => {
  return tenantDbMigrationQueue.add(TENANT_DB_MIGRATION_JOB.MIGRATE, data, opts);
};

/**
 * Enqueue multiple shop database migrations as individual parallel jobs in BullMQ
 */
export const addTenantDbMigrationBulkJobs = async (shopIds: string[], opts?: JobsOptions) => {
  const jobs = shopIds.map((shop_id) => ({
    name: TENANT_DB_MIGRATION_JOB.MIGRATE,
    data: { shop_id },
    opts,
  }));

  return tenantDbMigrationQueue.addBulk(jobs);
};

/**
 * Discover active/target shops and enqueue bulk database migration jobs
 */
export const triggerBulkTenantDbMigration = async (shopIds?: string[]) => {
  const targetShops = await prisma.shop.findMany({
    where: {
      deleted_at: null,
      ...(shopIds && shopIds.length > 0 ? { id: { in: shopIds } } : {}),
    },
    select: { id: true },
  });

  const ids = targetShops.map((s) => s.id);
  if (ids.length > 0) {
    await addTenantDbMigrationBulkJobs(ids);
  }

  return {
    total_queued: ids.length,
    shop_ids: ids,
  };
};
