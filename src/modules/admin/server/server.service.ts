import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TAdminCache } from "../admin/admin.type.js";
import { TServerCreateInput, TServerListQuery, TServerUpdateInput } from "./server.type.js";

const create = async (payload: TServerCreateInput) => {
  const existingSlug = await prisma.server.findFirst({
    where: { slug: payload.slug, deleted_at: null },
  });
  if (existingSlug) {
    throw new ApiError(httpStatus.CONFLICT, "Server with this slug already exists.");
  }

  if (payload.is_default_for_location) {
    await prisma.server.updateMany({
      where: { location: payload.location, is_default_for_location: true, deleted_at: null },
      data: { is_default_for_location: false },
    });
  }

  const serverData: Prisma.ServerCreateInput = {
    name: payload.name,
    slug: payload.slug,
    hostname: payload.hostname,
    public_ip: payload.public_ip,
    private_ip: payload.private_ip,
    ipv6: payload.ipv6,
    ssh_port: payload.ssh_port,
    location: payload.location,
    region_code: payload.region_code,
    availability_zone: payload.availability_zone,
    max_shops: payload.max_shops,
    priority: payload.priority,
    weight: payload.weight,
    is_accepting_shops: payload.is_accepting_shops,
    is_default_for_location: payload.is_default_for_location,
    status: payload.status,
    health_status: payload.health_status,
    environment: payload.environment,
    provider: payload.provider,
    provider_instance_id: payload.provider_instance_id,
    cpu_cores: payload.cpu_cores,
    memory_mb: payload.memory_mb,
    disk_gb: payload.disk_gb,
    os_image: payload.os_image,
    agent_version: payload.agent_version,
    deploy_base_url: payload.deploy_base_url,
    labels: payload.labels ? (payload.labels as Prisma.InputJsonValue) : Prisma.JsonNull,
    metadata: payload.metadata ? (payload.metadata as Prisma.InputJsonValue) : Prisma.JsonNull,
    notes: payload.notes,
  };

  return prisma.server.create({
    data: serverData,
  });
};

const list = async (query: TServerListQuery = {} as TServerListQuery) => {
  const {
    search,
    location,
    status,
    health_status,
    environment,
    provider,
    is_accepting_shops,
    is_default_for_location,
    ...pagination
  } = query;

  const where: Prisma.ServerWhereInput = {
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
            { public_ip: { contains: search, mode: "insensitive" } },
            { hostname: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(location ? { location } : {}),
    ...(status ? { status } : {}),
    ...(health_status ? { health_status } : {}),
    ...(environment ? { environment } : {}),
    ...(provider ? { provider } : {}),
    ...(typeof is_accepting_shops === "boolean" ? { is_accepting_shops } : {}),
    ...(typeof is_default_for_location === "boolean" ? { is_default_for_location } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.server,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: [
      "created_at",
      "updated_at",
      "name",
      "priority",
      "current_shop_count",
      "status",
      "health_status",
    ],
    select: {
      id: true,
      name: true,
      slug: true,
      hostname: true,
      public_ip: true,
      private_ip: true,
      ipv6: true,
      ssh_port: true,
      location: true,
      region_code: true,
      availability_zone: true,
      max_shops: true,
      current_shop_count: true,
      priority: true,
      weight: true,
      is_accepting_shops: true,
      is_default_for_location: true,
      status: true,
      health_status: true,
      last_health_check_at: true,
      last_seen_at: true,
      environment: true,
      provider: true,
      provider_instance_id: true,
      cpu_cores: true,
      memory_mb: true,
      disk_gb: true,
      created_at: true,
      updated_at: true,
    },
  });
};

const details = async (id: string) => {
  const server = await prisma.server.findFirst({
    where: { id, deleted_at: null },
    include: {
      _count: {
        select: { shops: true },
      },
    },
  });

  if (!server) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }

  return server;
};

const update = async (id: string, payload: TServerUpdateInput) => {
  const existing = await prisma.server.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }

  if (payload.slug && payload.slug !== existing.slug) {
    const slugConflict = await prisma.server.findFirst({
      where: { slug: payload.slug, NOT: { id }, deleted_at: null },
    });
    if (slugConflict) {
      throw new ApiError(httpStatus.CONFLICT, "Server with this slug already exists.");
    }
  }

  const targetLocation = payload.location || existing.location;
  if (payload.is_default_for_location) {
    await prisma.server.updateMany({
      where: {
        location: targetLocation,
        is_default_for_location: true,
        NOT: { id },
        deleted_at: null,
      },
      data: { is_default_for_location: false },
    });
  }

  const updateData: Prisma.ServerUpdateInput = {
    ...payload,
    labels: payload.labels !== undefined ? (payload.labels as Prisma.InputJsonValue) : undefined,
    metadata:
      payload.metadata !== undefined ? (payload.metadata as Prisma.InputJsonValue) : undefined,
  };

  return prisma.server.update({
    where: { id },
    data: updateData,
  });
};

const softDelete = async (id: string, admin: TAdminCache) => {
  const existing = await prisma.server.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }

  if (existing.current_shop_count > 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot delete server. It is currently hosting ${existing.current_shop_count} shop(s).`,
    );
  }

  return prisma.server.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      deleted_by_id: admin.id,
      status: "DELETED",
    },
  });
};

const toggleDrain = async (id: string, is_accepting_shops: boolean) => {
  const existing = await prisma.server.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }

  return prisma.server.update({
    where: { id },
    data: { is_accepting_shops },
  });
};

const setDefault = async (id: string, is_default_for_location: boolean) => {
  const existing = await prisma.server.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Server not found.");
  }

  if (is_default_for_location) {
    await prisma.server.updateMany({
      where: {
        location: existing.location,
        is_default_for_location: true,
        NOT: { id },
        deleted_at: null,
      },
      data: { is_default_for_location: false },
    });
  }

  return prisma.server.update({
    where: { id },
    data: { is_default_for_location },
  });
};

export const ServerService = {
  create,
  list,
  details,
  update,
  softDelete,
  toggleDrain,
  setDefault,
};
