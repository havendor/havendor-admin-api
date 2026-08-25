import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { FeatureStatus, Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TFeatureCreateInput, TFeatureListQuery, TFeatureUpdateInput } from "./feature.type.js";

const create = async (payload: TFeatureCreateInput) => {
  const exists = await prisma.feature.findFirst({ where: { key: payload.key, deleted_at: null } });
  if (exists) throw new ApiError(httpStatus.CONFLICT, "Feature key already exists.");
  return prisma.feature.create({ data: payload });
};

const list = async (query: TFeatureListQuery = {} as TFeatureListQuery) => {
  const { search, type, status, ...pagination } = query;
  const where: Prisma.FeatureWhereInput = {
    deleted_at: null,
    ...(search
      ? {
          OR: [
            { key: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  };
  return dbQueryWithPagination({
    model: prisma.feature,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: ["created_at", "updated_at", "key", "name", "type", "status"],
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
      type: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });
};

const details = async (id: string) => {
  const feature = await prisma.feature.findFirst({ where: { id, deleted_at: null } });
  if (!feature) throw new ApiError(httpStatus.NOT_FOUND, "Feature not found.");
  return feature;
};

const update = async (id: string, payload: TFeatureUpdateInput) => {
  await details(id);
  if (payload.key) {
    const conflict = await prisma.feature.findFirst({
      where: { key: payload.key, NOT: { id }, deleted_at: null },
    });
    if (conflict) throw new ApiError(httpStatus.CONFLICT, "Feature key already exists.");
  }
  return prisma.feature.update({ where: { id }, data: payload });
};

const softDelete = async (id: string) => {
  await details(id);
  return prisma.feature.update({
    where: { id },
    data: { deleted_at: new Date(), status: FeatureStatus.INACTIVE },
  });
};

export const FeatureService = { create, list, details, update, softDelete };
