import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, encryptSecret, prisma } from "../../../utility/index.js";
import { TAdminCache } from "../admin/admin.type.js";
import { TDatabaseCreateInput, TDatabaseListQuery, TDatabaseUpdateInput } from "./database.type.js";

const create = async (payload: TDatabaseCreateInput) => {
  const existingSlug = await prisma.database.findFirst({
    where: { slug: payload.slug, deleted_at: null },
  });
  if (existingSlug) {
    throw new ApiError(httpStatus.CONFLICT, "Database with this slug already exists.");
  }

  if (payload.is_default) {
    await prisma.database.updateMany({
      where: { is_default: true, deleted_at: null },
      data: { is_default: false },
    });
  }

  const { password, labels, metadata, ...rest } = payload;
  const password_encrypted = encryptSecret(password);

  const databaseData: Prisma.DatabaseCreateInput = {
    ...rest,
    password_encrypted,
    labels: labels ? (labels as Prisma.InputJsonValue) : Prisma.JsonNull,
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
  };

  const created = await prisma.database.create({
    data: databaseData,
  });

  const { password_encrypted: _, ...result } = created;
  return result;
};

const list = async (query: TDatabaseListQuery = {} as TDatabaseListQuery) => {
  const {
    search,
    provider,
    status,
    health_status,
    environment,
    location,
    is_accepting_schemas,
    is_default,
    ...pagination
  } = query;

  const where: Prisma.DatabaseWhereInput = {
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { host: { contains: search, mode: "insensitive" } },
            { db_name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(provider ? { provider } : {}),
    ...(status ? { status } : {}),
    ...(health_status ? { health_status } : {}),
    ...(environment ? { environment } : {}),
    ...(location ? { location } : {}),
    ...(typeof is_accepting_schemas === "boolean" ? { is_accepting_schemas } : {}),
    ...(typeof is_default === "boolean" ? { is_default } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.database,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: [
      "created_at",
      "updated_at",
      "name",
      "priority",
      "current_schema_count",
      "status",
      "health_status",
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      hostname: true,
      provider: true,
      provider_instance_id: true,
      environment: true,
      location: true,
      region_code: true,
      host: true,
      port: true,
      db_name: true,
      username: true,
      ssl_mode: true,
      max_schemas: true,
      current_schema_count: true,
      priority: true,
      is_accepting_schemas: true,
      is_default: true,
      status: true,
      health_status: true,
      last_health_check_at: true,
      labels: true,
      metadata: true,
      notes: true,
      created_at: true,
      updated_at: true,
    },
  });
};

const details = async (id: string) => {
  const database = await prisma.database.findFirst({
    where: { id, deleted_at: null },
    include: {
      _count: {
        select: { shops: true },
      },
    },
  });

  if (!database) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }

  const { password_encrypted: _, ...result } = database;
  return result;
};

const update = async (id: string, payload: TDatabaseUpdateInput) => {
  const existing = await prisma.database.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugConflict = await prisma.database.findFirst({
      where: { slug: payload.slug, NOT: { id }, deleted_at: null },
    });
    if (slugConflict) {
      throw new ApiError(httpStatus.CONFLICT, "Database with this slug already exists.");
    }
  }

  if (payload.is_default) {
    await prisma.database.updateMany({
      where: { is_default: true, NOT: { id }, deleted_at: null },
      data: { is_default: false },
    });
  }

  const { password, labels, metadata, ...rest } = payload;
  const updateData: Prisma.DatabaseUpdateInput = {
    ...rest,
    ...(labels !== undefined
      ? { labels: labels ? (labels as Prisma.InputJsonValue) : Prisma.JsonNull }
      : {}),
    ...(metadata !== undefined
      ? { metadata: metadata ? (metadata as Prisma.InputJsonValue) : Prisma.JsonNull }
      : {}),
  };

  if (password) {
    updateData.password_encrypted = encryptSecret(password);
  }

  const updated = await prisma.database.update({
    where: { id },
    data: updateData,
  });

  const { password_encrypted: _, ...result } = updated;
  return result;
};

const softDelete = async (id: string, admin: TAdminCache) => {
  const existing = await prisma.database.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }

  if (existing.current_schema_count > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete database host. It currently contains ${existing.current_schema_count} active shop schema(s).`,
    );
  }

  const updated = await prisma.database.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by_id: admin.id,
      status: "DELETED",
    },
  });

  const { password_encrypted: _, ...result } = updated;
  return result;
};

const toggleDrain = async (id: string, is_accepting_schemas: boolean) => {
  const existing = await prisma.database.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }

  const updated = await prisma.database.update({
    where: { id },
    data: { is_accepting_schemas },
  });

  const { password_encrypted: _, ...result } = updated;
  return result;
};

const setDefault = async (id: string, is_default: boolean) => {
  const existing = await prisma.database.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Database host not found.");
  }

  if (is_default) {
    await prisma.database.updateMany({
      where: { is_default: true, NOT: { id }, deleted_at: null },
      data: { is_default: false },
    });
  }

  const updated = await prisma.database.update({
    where: { id },
    data: { is_default },
  });

  const { password_encrypted: _, ...result } = updated;
  return result;
};

export const DatabaseService = {
  create,
  list,
  details,
  update,
  softDelete,
  toggleDrain,
  setDefault,
};
