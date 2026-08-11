-- CreateEnum
CREATE TYPE "DatabaseProvider" AS ENUM (
  'SELF_HOSTED',
  'NEON',
  'AWS_RDS',
  'SUPABASE',
  'DIGITALOCEAN',
  'GCP_CLOUD_SQL',
  'AZURE_POSTGRES',
  'CUSTOM'
);

-- CreateEnum
CREATE TYPE "DatabaseSslMode" AS ENUM (
  'DISABLE',
  'PREFER',
  'REQUIRE',
  'VERIFY_CA',
  'VERIFY_FULL'
);

-- CreateTable
CREATE TABLE "databases" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "hostname" TEXT,
    "provider" "DatabaseProvider" NOT NULL,
    "provider_instance_id" TEXT,
    "environment" "ServerEnvironment" NOT NULL DEFAULT 'PRODUCTION',
    "location" "ServerLocation",
    "region_code" TEXT,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 5432,
    "db_name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password_encrypted" TEXT NOT NULL,
    "ssl_mode" "DatabaseSslMode" NOT NULL DEFAULT 'REQUIRE',
    "max_schemas" INTEGER,
    "current_schema_count" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_accepting_schemas" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" "ColumnGenericStatus" NOT NULL DEFAULT 'PENDING',
    "health_status" "ServerHealthStatus" NOT NULL DEFAULT 'UNKNOWN',
    "last_health_check_at" TIMESTAMP(3),
    "labels" JSONB,
    "metadata" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,

    CONSTRAINT "databases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "databases_slug_key" ON "databases"("slug");

-- CreateIndex
CREATE INDEX "databases_status_is_accepting_schemas_priority_idx" ON "databases"("status", "is_accepting_schemas", "priority");

-- CreateIndex
CREATE INDEX "databases_is_default_status_idx" ON "databases"("is_default", "status");

-- CreateIndex
CREATE INDEX "databases_provider_status_idx" ON "databases"("provider", "status");

-- CreateIndex
CREATE INDEX "databases_status_health_status_last_health_check_at_idx" ON "databases"("status", "health_status", "last_health_check_at");

-- CreateIndex
CREATE INDEX "databases_environment_status_created_at_idx" ON "databases"("environment", "status", "created_at");

-- CreateIndex
CREATE INDEX "databases_deleted_at_created_at_idx" ON "databases"("deleted_at", "created_at");

-- CreateIndex
CREATE INDEX "databases_host_idx" ON "databases"("host");

-- AddForeignKey
ALTER TABLE "databases" ADD CONSTRAINT "databases_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Shop: database host + immutable schema name (nullable first for backfill)
ALTER TABLE "shops" ADD COLUMN "database_id" TEXT;
ALTER TABLE "shops" ADD COLUMN "db_schema_name" TEXT;

-- Bootstrap placeholder host if any shop exists without a database assignment
INSERT INTO "databases" (
  "id",
  "name",
  "slug",
  "hostname",
  "provider",
  "environment",
  "location",
  "region_code",
  "host",
  "port",
  "db_name",
  "username",
  "password_encrypted",
  "ssl_mode",
  "max_schemas",
  "current_schema_count",
  "priority",
  "is_accepting_schemas",
  "is_default",
  "status",
  "health_status",
  "notes",
  "created_at",
  "updated_at"
)
SELECT
  '00000000-0000-4000-8000-0000000000db',
  'Bootstrap Shop Database',
  'bootstrap-shop-db',
  'localhost',
  'SELF_HOSTED',
  'DEVELOPMENT',
  'ASIA_PACIFIC',
  'local',
  '127.0.0.1',
  5432,
  'havendor_shops',
  'havendor',
  'MIGRATION_PLACEHOLDER_REPLACE_VIA_SEED',
  'DISABLE',
  1000,
  0,
  1,
  true,
  true,
  'ACTIVE',
  'UNKNOWN',
  'Auto-created by migration for existing shops; replace credentials via seed/admin',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE EXISTS (SELECT 1 FROM "shops" WHERE "database_id" IS NULL)
  AND NOT EXISTS (SELECT 1 FROM "databases" WHERE "slug" = 'bootstrap-shop-db');

-- Backfill shops that lack database assignment
UPDATE "shops" s
SET
  "database_id" = d."id",
  "db_schema_name" = lower('shop_' || s."identity")
FROM "databases" d
WHERE s."database_id" IS NULL
  AND d."slug" = 'bootstrap-shop-db';

-- Refresh schema counts on bootstrap host
UPDATE "databases" d
SET "current_schema_count" = (
  SELECT COUNT(*)::INTEGER FROM "shops" s WHERE s."database_id" = d."id"
)
WHERE d."slug" = 'bootstrap-shop-db';

-- Enforce NOT NULL after backfill
ALTER TABLE "shops" ALTER COLUMN "database_id" SET NOT NULL;
ALTER TABLE "shops" ALTER COLUMN "db_schema_name" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "shops_database_id_db_schema_name_key" ON "shops"("database_id", "db_schema_name");

-- CreateIndex
CREATE INDEX "idx_shop_database_id_status_created_at" ON "shops"("database_id", "status", "created_at");

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_database_id_fkey" FOREIGN KEY ("database_id") REFERENCES "databases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
