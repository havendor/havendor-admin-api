export const QUEUE_NAME = {
  TENANT_DB_MIGRATION: "tenant-db-migration",
} as const;

export const TENANT_DB_MIGRATION_JOB = {
  MIGRATE: "migrate_tenant_db",
  BULK_MIGRATE: "bulk_migrate_tenant_db",
} as const;

export type TTenantDbMigrationJobData = {
  shop_id: string;
  force?: boolean;
};

export type TTenantDbBulkMigrationJobData = {
  shop_ids?: string[];
};
