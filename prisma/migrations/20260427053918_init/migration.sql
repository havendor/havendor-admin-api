-- CreateEnum
CREATE TYPE "ServerLocation" AS ENUM ('ASIA_PACIFIC', 'FRANKFURT');

-- CreateEnum
CREATE TYPE "ColumnGenericStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DELETED', 'PENDING');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TERMINATED', 'DELETED', 'NEEDS_PASSWORD_CHANGE');

-- CreateEnum
CREATE TYPE "ShopDomainType" AS ENUM ('SUBDOMAIN', 'CUSTOM');

-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'DNS_PENDING', 'VERIFIED', 'ACTIVE', 'FAILED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DomainSSLStatus" AS ENUM ('PENDING', 'PROVISIONING', 'ACTIVE', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "alt_mobile" TEXT,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profile_image" TEXT,
    "identity_document" TEXT,
    "bio" TEXT,
    "last_education" TEXT,
    "present_address_id" TEXT NOT NULL,
    "permanent_address_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "terminated_by_id" TEXT,
    "deleted_by_id" TEXT,
    "created_by_id" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_lockout_at" TIMESTAMP(3),
    "lockout_count" INTEGER,
    "terminated_at" TIMESTAMP(3),
    "termination_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "delete_reason" TEXT,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_sessions" (
    "id" TEXT NOT NULL,
    "admin_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip" TEXT,
    "os" TEXT,
    "os_version" TEXT,
    "browser" TEXT,
    "browser_version" TEXT,
    "expires_in" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionGroup" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PermissionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "group_id" INTEGER NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ColumnGenericStatus" NOT NULL DEFAULT 'ACTIVE',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "permission_id" INTEGER NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "address_name" TEXT NOT NULL,
    "full_name" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "address_line_1" TEXT NOT NULL,
    "address_line_2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip_code" TEXT,
    "country" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT,
    "email" TEXT NOT NULL,
    "mobile" TEXT,
    "alt_mobile" TEXT,
    "password" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "profile_image" TEXT,
    "identity_document" TEXT,
    "bio" TEXT,
    "last_education" TEXT,
    "present_address_id" TEXT NOT NULL,
    "permanent_address_id" TEXT NOT NULL,
    "terminated_by_id" TEXT,
    "deleted_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_lockout_at" TIMESTAMP(3),
    "lockout_count" INTEGER,
    "terminated_at" TIMESTAMP(3),
    "termination_reason" TEXT,
    "deleted_at" TIMESTAMP(3),
    "delete_reason" TEXT,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tenant_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "refresh_token_hash" TEXT NOT NULL,
    "ip" TEXT,
    "os" TEXT,
    "os_version" TEXT,
    "browser" TEXT,
    "browser_version" TEXT,
    "expires_in" TIMESTAMP(3) NOT NULL,
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shops" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shop_name" TEXT NOT NULL,
    "identity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ColumnGenericStatus" NOT NULL DEFAULT 'PENDING',
    "server_location" "ServerLocation" NOT NULL DEFAULT 'ASIA_PACIFIC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deleted_by_id" TEXT,

    CONSTRAINT "shops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_domains" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" "ShopDomainType" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "dns_target" TEXT,
    "dns_verified" BOOLEAN NOT NULL DEFAULT false,
    "dns_verified_at" TIMESTAMP(3),
    "ssl_status" "DomainSSLStatus" NOT NULL DEFAULT 'PENDING',
    "ssl_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ssl_expires_at" TIMESTAMP(3),
    "last_checked_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shop_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shop_databases" (
    "id" TEXT NOT NULL,
    "shop_id" TEXT NOT NULL,
    "connection_url" TEXT NOT NULL,
    "db_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "shop_databases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_employee_id_key" ON "admins"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admins_mobile_key" ON "admins"("mobile");

-- CreateIndex
CREATE INDEX "admins_first_name_idx" ON "admins"("first_name");

-- CreateIndex
CREATE INDEX "admins_last_name_idx" ON "admins"("last_name");

-- CreateIndex
CREATE INDEX "admins_role_id_idx" ON "admins"("role_id");

-- CreateIndex
CREATE INDEX "admins_status_idx" ON "admins"("status");

-- CreateIndex
CREATE INDEX "admins_created_at_idx" ON "admins"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "admin_sessions_refresh_token_hash_key" ON "admin_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "admin_sessions_admin_id_idx" ON "admin_sessions"("admin_id");

-- CreateIndex
CREATE INDEX "admin_sessions_created_at_idx" ON "admin_sessions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "PermissionGroup_name_key" ON "PermissionGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE INDEX "roles_created_at_idx" ON "roles"("created_at");

-- CreateIndex
CREATE INDEX "role_permissions_role_id_idx" ON "role_permissions"("role_id");

-- CreateIndex
CREATE INDEX "role_permissions_permission_id_idx" ON "role_permissions"("permission_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "addresses_mobile_idx" ON "addresses"("mobile");

-- CreateIndex
CREATE INDEX "addresses_email_idx" ON "addresses"("email");

-- CreateIndex
CREATE INDEX "addresses_created_at_idx" ON "addresses"("created_at");

-- CreateIndex
CREATE INDEX "addresses_address_name_idx" ON "addresses"("address_name");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_email_key" ON "tenants"("email");

-- CreateIndex
CREATE UNIQUE INDEX "tenants_mobile_key" ON "tenants"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_sessions_refresh_token_hash_key" ON "tenant_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "tenant_sessions_tenant_id_idx" ON "tenant_sessions"("tenant_id");

-- CreateIndex
CREATE INDEX "tenant_sessions_created_at_idx" ON "tenant_sessions"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "shops_identity_key" ON "shops"("identity");

-- CreateIndex
CREATE INDEX "shops_tenant_id_idx" ON "shops"("tenant_id");

-- CreateIndex
CREATE INDEX "shops_shop_name_idx" ON "shops"("shop_name");

-- CreateIndex
CREATE UNIQUE INDEX "shop_domains_domain_key" ON "shop_domains"("domain");

-- CreateIndex
CREATE INDEX "shop_domains_domain_idx" ON "shop_domains"("domain");

-- CreateIndex
CREATE INDEX "shop_domains_shop_id_idx" ON "shop_domains"("shop_id");

-- CreateIndex
CREATE INDEX "shop_domains_shop_id_is_primary_status_idx" ON "shop_domains"("shop_id", "is_primary", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shop_databases_shop_id_key" ON "shop_databases"("shop_id");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_present_address_id_fkey" FOREIGN KEY ("present_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_permanent_address_id_fkey" FOREIGN KEY ("permanent_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_terminated_by_id_fkey" FOREIGN KEY ("terminated_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "PermissionGroup"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles" ADD CONSTRAINT "roles_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_present_address_id_fkey" FOREIGN KEY ("present_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_permanent_address_id_fkey" FOREIGN KEY ("permanent_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_terminated_by_id_fkey" FOREIGN KEY ("terminated_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tenant_sessions" ADD CONSTRAINT "tenant_sessions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shops" ADD CONSTRAINT "shops_deleted_by_id_fkey" FOREIGN KEY ("deleted_by_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_domains" ADD CONSTRAINT "shop_domains_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shop_databases" ADD CONSTRAINT "shop_databases_shop_id_fkey" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
