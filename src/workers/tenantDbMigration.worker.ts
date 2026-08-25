import { Logger, redisQueueConnection } from "@havendor/server-core";
import {
  buildTenantDatabaseUrl,
  ensureTenantSchema,
  getPrismaMigrationsDir,
  getPrismaSchemaDir,
} from "@havendor/tenant-schema";
import { Worker } from "bullmq";
import { exec } from "node:child_process";
import fs from "node:fs";
import { promisify } from "node:util";
import {
  QUEUE_NAME,
  TENANT_DB_MIGRATION_JOB,
  TTenantDbBulkMigrationJobData,
  TTenantDbMigrationJobData,
} from "../const/index.js";
import { decryptSecret, prisma } from "../utility/index.js";

const execAsync = promisify(exec);

/**
 * Reads the migrations directory from @havendor/tenant-schema and returns the latest migration directory name
 */
export const getLatestTenantMigrationName = (): string | null => {
  try {
    const migrationsDir = getPrismaMigrationsDir();
    if (!fs.existsSync(migrationsDir)) return null;

    const entries = fs
      .readdirSync(migrationsDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    return entries.length > 0 ? entries[entries.length - 1] : null;
  } catch {
    return null;
  }
};

/**
 * Runs Prisma migration deploy on the tenant database schema using child_process
 */
export const runTenantPrismaMigration = async (
  tenantDatabaseUrl: string,
): Promise<{ stdout: string; stderr: string }> => {
  const schemaDir = getPrismaSchemaDir();
  const command = `npx prisma migrate deploy --schema="${schemaDir}"`;

  return execAsync(command, {
    env: {
      ...process.env,
      DATABASE_URL: tenantDatabaseUrl,
    },
  });
};

/**
 * Core migration function for a single shop database.
 * Sets up PostgreSQL schema, prepares the connection URL with schema isolation,
 * runs `prisma migrate deploy` via child_process, and updates shop migration metadata.
 */
export const migrateSingleShopDb = async (shopId: string) => {
  Logger.job.info(`[TenantMigration] Initiating migration for shop ID: ${shopId}`);

  const shop = await prisma.shop.findFirst({
    where: { id: shopId, deleted_at: null },
    include: {
      database: true,
      tenant: true,
    },
  });

  if (!shop) {
    Logger.job.error(`[TenantMigration] Shop with ID "${shopId}" not found. Skipping.`);
    throw new Error(`Shop with ID "${shopId}" not found.`);
  }

  if (!shop.database) {
    const msg = `Shop "${shop.id}" (${shop.shop_name}) has no database host assigned.`;
    Logger.job.error(`[TenantMigration] ${msg}`);
    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        db_status: "FAILED",
        is_last_migration_success: false,
        db_error_message: msg,
      },
    });
    throw new Error(msg);
  }

  // 1. Mark status as MIGRATING
  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      db_status: "MIGRATING",
      db_error_message: null,
    },
  });

  try {
    // 2. Decrypt DB password and build connection URLs
    const password = decryptSecret(shop.database.password_encrypted);
    const baseConnectionString = `postgresql://${encodeURIComponent(
      shop.database.username,
    )}:${encodeURIComponent(password)}@${shop.database.host}:${shop.database.port}/${
      shop.database.db_name
    }?sslmode=${shop.database.ssl_mode.toLowerCase()}`;

    const tenantDatabaseUrl = buildTenantDatabaseUrl(baseConnectionString, shop.db_schema_name);

    // 3. Ensure PostgreSQL schema exists before Prisma connects
    await ensureTenantSchema(baseConnectionString, shop.db_schema_name);

    // 4. Run Prisma migrate deploy via child_process
    Logger.job.info(
      `[TenantMigration] Running 'prisma migrate deploy' for schema "${shop.db_schema_name}"...`,
    );
    const { stdout, stderr } = await runTenantPrismaMigration(tenantDatabaseUrl);

    if (stdout) {
      Logger.job.info(`[TenantMigration] Output for shop ${shop.id}:\n${stdout}`);
    }
    if (stderr) {
      Logger.job.warn(`[TenantMigration] Stderr for shop ${shop.id}:\n${stderr}`);
    }

    // 5. Update Shop to READY
    const latestMigrationName = getLatestTenantMigrationName();
    const updatedShop = await prisma.shop.update({
      where: { id: shop.id },
      data: {
        db_status: "READY",
        is_migration_completed: true,
        last_migration_name: latestMigrationName ?? shop.last_migration_name,
        last_migration_at: new Date(),
        is_last_migration_success: true,
        db_error_message: null,
      },
    });

    Logger.job.info(
      `[TenantMigration] Successfully migrated database for shop ${shop.id} (${shop.db_schema_name}).`,
    );

    return {
      success: true,
      shop: updatedShop,
      output: stdout,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    Logger.job.error(
      `[TenantMigration] Migration failed for shop ${shop.id} (${shop.db_schema_name}):`,
      error,
    );

    await prisma.shop.update({
      where: { id: shop.id },
      data: {
        db_status: "FAILED",
        is_last_migration_success: false,
        db_error_message: errorMessage,
      },
    });

    throw error;
  }
};

/**
 * Bulk migration processor compatible with sequential / parallel execution.
 */
export const migrateBulkShopDbs = async (shopIds?: string[]) => {
  const targetShops = await prisma.shop.findMany({
    where: {
      deleted_at: null,
      ...(shopIds && shopIds.length > 0 ? { id: { in: shopIds } } : {}),
    },
    select: { id: true, shop_name: true, db_schema_name: true },
  });

  Logger.job.info(`[TenantMigration] Starting bulk migration for ${targetShops.length} shops.`);

  const results: {
    shop_id: string;
    success: boolean;
    error?: string;
  }[] = [];

  for (const shop of targetShops) {
    try {
      await migrateSingleShopDb(shop.id);
      results.push({ shop_id: shop.id, success: true });
    } catch (err) {
      results.push({
        shop_id: shop.id,
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;

  Logger.job.info(
    `[TenantMigration] Bulk migration finished. Total: ${results.length}, Succeeded: ${successCount}, Failed: ${failureCount}`,
  );

  return {
    total: results.length,
    succeeded: successCount,
    failed: failureCount,
    details: results,
  };
};

/**
 * BullMQ Worker instance handling tenant DB migrations
 */
export const tenantDbMigrationWorker = new Worker<
  TTenantDbMigrationJobData | TTenantDbBulkMigrationJobData
>(
  QUEUE_NAME.TENANT_DB_MIGRATION,
  async (job) => {
    switch (job.name) {
      case TENANT_DB_MIGRATION_JOB.MIGRATE: {
        const data = job.data as TTenantDbMigrationJobData;
        await migrateSingleShopDb(data.shop_id);
        break;
      }
      case TENANT_DB_MIGRATION_JOB.BULK_MIGRATE: {
        const data = job.data as TTenantDbBulkMigrationJobData;
        await migrateBulkShopDbs(data.shop_ids);
        break;
      }
      default: {
        Logger.job.warn(
          `[TenantMigration] Unknown job "${job.name}" on queue ${QUEUE_NAME.TENANT_DB_MIGRATION}`,
        );
      }
    }
  },
  {
    connection: redisQueueConnection,
    concurrency: 5,
  },
);

tenantDbMigrationWorker.on("completed", (job) => {
  Logger.job.info(`[TenantMigration] Job ${job.id} (${job.name}) completed.`);
});

tenantDbMigrationWorker.on("failed", (job, err) => {
  Logger.job.error(`[TenantMigration] Job ${job?.id} (${job?.name}) failed:`, err);
});

tenantDbMigrationWorker.on("error", (err) => {
  Logger.job.error("[TenantMigration] Worker encountered error:", err);
});
