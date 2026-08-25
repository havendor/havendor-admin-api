import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import { randomInt } from "crypto";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import {
  TTenantShopCreateInput,
  TTenantShopListQuery,
  TTenantShopUpdateInput,
} from "./tenantShop.type.js";

const generateShopIdentity = async (): Promise<string> => {
  const randomDigits = randomInt(10000000, 100000000).toString();
  return `S${randomDigits}`;
};

const shopSelectSafe = {
  id: true,
  shop_name: true,
  identity: true,
  description: true,
  status: true,
  tenant_id: true,
  active_subscription_id: true,
  created_at: true,
  updated_at: true,
};

export const createShop = async (tenantId: string, payload: TTenantShopCreateInput) => {
  const tenant = await prisma.tenant.findFirst({
    where: { id: tenantId, deleted_at: null },
  });
  if (!tenant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found.");
  }

  // Find an available server
  const server = await prisma.server.findFirst({
    where: {
      is_accepting_shops: true,
      status: "ACTIVE",
      deleted_at: null,
    },
    orderBy: [{ priority: "asc" }, { current_shop_count: "asc" }],
  });

  if (!server) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "No available servers to host the shop.");
  }

  // Find an available database
  const database = await prisma.database.findFirst({
    where: {
      is_accepting_schemas: true,
      status: "ACTIVE",
      deleted_at: null,
    },
    orderBy: [{ priority: "asc" }, { current_schema_count: "asc" }],
  });

  if (!database) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, "No available databases to host the shop.");
  }

  const identity = await generateShopIdentity();
  const db_schema_name = `shop_${identity.toLowerCase()}`;

  const existingIdentity = await prisma.shop.findFirst({
    where: { identity },
  });
  if (existingIdentity) {
    throw new ApiError(httpStatus.CONFLICT, "Shop identity conflict, please try again.");
  }

  const existingSchema = await prisma.shop.findFirst({
    where: { database_id: database.id, db_schema_name },
  });
  if (existingSchema) {
    throw new ApiError(
      httpStatus.CONFLICT,
      "Database schema name already exists on the selected host.",
    );
  }

  return prisma.$transaction(async (tx) => {
    const shop = await tx.shop.create({
      data: {
        tenant_id: tenant.id,
        shop_name: payload.shop_name,
        description: payload.description,
        server_id: server.id,
        database_id: database.id,
        identity,
        db_schema_name,
        status: "PENDING",
        db_status: "PENDING",
      },
      select: shopSelectSafe,
    });

    await tx.server.update({
      where: { id: server.id },
      data: { current_shop_count: { increment: 1 } },
    });

    await tx.database.update({
      where: { id: database.id },
      data: { current_schema_count: { increment: 1 } },
    });

    return shop;
  });
};

export const updateShop = async (
  tenantId: string,
  shopId: string,
  payload: TTenantShopUpdateInput,
) => {
  const existing = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.shop.update({
    where: { id: shopId },
    data: payload,
    select: shopSelectSafe,
  });
};

export const listShops = async (tenantId: string, query: TTenantShopListQuery) => {
  const { search, status, ...pagination } = query;

  const where: Prisma.ShopWhereInput = {
    tenant_id: tenantId,
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { shop_name: { contains: search, mode: "insensitive" } },
            { identity: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.shop,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: ["created_at", "updated_at", "shop_name", "identity", "status"],
    select: shopSelectSafe,
  });
};

export const getShopDetails = async (tenantId: string, shopId: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: tenantId, deleted_at: null },
    select: {
      ...shopSelectSafe,
      domains: {
        where: { deleted_at: null },
        select: {
          id: true,
          domain: true,
          type: true,
          is_primary: true,
          status: true,
          ssl_status: true,
        },
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

export const softDeleteShop = async (tenantId: string, shopId: string) => {
  const existing = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: tenantId, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  return prisma.$transaction(async (tx) => {
    const deletedShop = await tx.shop.update({
      where: { id: shopId },
      data: {
        deleted_at: new Date(),
      },
      select: shopSelectSafe,
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

export const TenantShopService = {
  createShop,
  updateShop,
  listShops,
  getShopDetails,
  softDeleteShop,
};
