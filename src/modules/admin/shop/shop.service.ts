import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import { randomInt } from "crypto";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { addTenantDbMigrationJob, triggerBulkTenantDbMigration } from "../../../queues/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TAdminCache } from "../admin/admin.type.js";
import {
  TShopBulkMigrateInput,
  TShopCreateInput,
  TShopListQuery,
  TShopUpdateInput,
} from "./shop.type.js";

const generateShopIdentity = async (): Promise<string> => {
  const randomDigits = randomInt(10000000, 100000000).toString();
  return `S${randomDigits}`;
};

const create = async (payload: TShopCreateInput) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id: payload.tenant_id, deleted_at: null },
  });
  if (!tenant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found.");
  }

  const server = await prisma.server.findFirst({
    where: { id: payload.server_id, deleted_at: null },
  });
  if (!server) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }
  if (!server.is_accepting_shops) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Target server is currently not accepting new shops (drained).",
    );
  }

  const database = await prisma.database.findFirst({
    where: { id: payload.database_id, deleted_at: null },
  });
  if (!database) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }
  if (!database.is_accepting_schemas) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Target database host is currently not accepting new schemas (drained).",
    );
  }

  const identity = payload.identity || (await generateShopIdentity());
  const db_schema_name = payload.db_schema_name || `shop_${identity.toLowerCase()}`;

  const existingIdentity = await prisma.shop.findFirst({
    where: { identity },
  });
  if (existingIdentity) {
    throw new ApiError(httpStatus.CONFLICT, "Shop identity already exists.");
  }

  const existingSchema = await prisma.shop.findFirst({
    where: { database_id: payload.database_id, db_schema_name },
  });
  if (existingSchema) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Database schema name already exists on this database host.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        tenant_id: payload.tenant_id,
        shop_name: payload.shop_name,
        description: payload.description,
        server_id: payload.server_id,
        database_id: payload.database_id,
        identity,
        db_schema_name,
        status: payload.status || "PENDING",
      },
    });

    await tx.server.update({
      where: { id: payload.server_id },
      data: { current_shop_count: { increment: 1 } },
    });

    await tx.database.update({
      where: { id: payload.database_id },
      data: { current_schema_count: { increment: 1 } },
    });

    return shop;
  });
};

const list = async (query: TShopListQuery = {} as TShopListQuery) => {
  const { search, tenant_id, server_id, database_id, status, ...pagination } = query;

  const where: Prisma.ShopWhereInput = {
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { shop_name: { contains: search, mode: "insensitive" } },
            { identity: { contains: search, mode: "insensitive" } },
            { db_schema_name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(tenant_id ? { tenant_id } : {}),
    ...(server_id ? { server_id } : {}),
    ...(database_id ? { database_id } : {}),
    ...(status ? { status } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.shop,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: ["created_at", "updated_at", "shop_name", "identity", "status"],
    select: {
      id: true,
      shop_name: true,
      identity: true,
      description: true,
      status: true,
      db_schema_name: true,
      tenant_id: true,
      server_id: true,
      database_id: true,
      active_subscription_id: true,
      created_at: true,
      updated_at: true,
      tenant: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      server: {
        select: {
          id: true,
          name: true,
          slug: true,
          location: true,
        },
      },
      database: {
        select: {
          id: true,
          name: true,
          slug: true,
          provider: true,
        },
      },
    },
  });
};

const details = async (id: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
    include: {
      tenant: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          mobile: true,
          status: true,
        },
      },
      server: {
        select: {
          id: true,
          name: true,
          slug: true,
          location: true,
          public_ip: true,
          health_status: true,
        },
      },
      database: {
        select: {
          id: true,
          name: true,
          slug: true,
          provider: true,
          host: true,
          db_name: true,
        },
      },
      domains: {
        where: { deleted_at: null },
      },
      active_subscription: {
        include: {
          plan: true,
        },
      },
    },
  });

  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return shop;
};

const update = async (id: string, payload: TShopUpdateInput) => {
  const existing = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.shop.update({
    where: { id },
    data: payload,
  });
};

const softDelete = async (id: string, admin: TAdminCache) => {
  const existing = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.$transaction(async (tx) => {
    const deletedShop = await tx.shop.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by_id: admin.id,
      },
    });

    await tx.server.update({
      where: { id: existing.server_id },
      data: { current_shop_count: { decrement: 1 } },
    });

    await tx.database.update({
      where: { id: existing.database_id },
      data: { current_schema_count: { decrement: 1 } },
    });

    return deletedShop;
  });
};

const approve = async (id: string) => {
  const existing = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.shop.update({
    where: { id },
    data: { status_by_admin: "ACTIVE" },
  });
};

const suspend = async (id: string) => {
  const existing = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.shop.update({
    where: { id },
    data: { status: "INACTIVE" },
  });
};

const restore = async (id: string) => {
  const existing = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.shop.update({
    where: { id },
    data: { status: "ACTIVE" },
  });
};

const queueDbMigration = async (id: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id, deleted_at: null },
    include: { database: true },
  });
  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  if (!shop.database) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot queue migration: shop has no database host assigned.",
    );
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      db_status: "PENDING",
      db_error_message: null,
    },
  });

  const job = await addTenantDbMigrationJob({ shop_id: id });

  return {
    job_id: job.id,
    shop_id: shop.id,
    shop_name: shop.shop_name,
    db_schema_name: shop.db_schema_name,
    db_status: "PENDING",
  };
};

const queueBulkDbMigration = async (payload: TShopBulkMigrateInput = {}) => {
  const result = await triggerBulkTenantDbMigration(payload?.shop_ids);
  return result;
};

export const ShopService = {
  create,
  list,
  details,
  update,
  softDelete,
  approve,
  suspend,
  restore,
  queueDbMigration,
  queueBulkDbMigration,
};
