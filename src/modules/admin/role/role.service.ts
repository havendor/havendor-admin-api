import { ApiError, buildImageUrl } from "@havendor/server-core";
import httpStatus from "http-status";
import { ColumnGenericStatus, Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TAdminCache } from "../admin/admin.type.js";
import { TRoleInputSchema, TRoleListQuerySchema, TRoleUpdateSchema } from "./role.type.js";

const getAllPermissionFromDB = async () => {
  return await prisma.permissionGroup.findMany({
    select: {
      id: true,
      name: true,
      permissions: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
};

const createIntoDB = async (payload: TRoleInputSchema, user: TAdminCache) => {
  const { permissions, ...rest } = payload;
  const result = await prisma.role.create({
    data: {
      ...rest,
      permissions: {
        createMany: {
          data: permissions.map((permission) => ({
            permission_id: permission,
          })),
        },
      },
      created_by: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return result;
};

const updateIntoDB = async (id: string, data: TRoleUpdateSchema) => {
  const FAILED_TO_UPDATE = "Failed to update role";
  const existingRole = await prisma.role.findUnique({
    where: {
      id,
    },
  });
  if (!existingRole) {
    throw new ApiError(httpStatus.NOT_FOUND, FAILED_TO_UPDATE, "Role not found");
  }

  if (existingRole.is_system) {
    throw new ApiError(httpStatus.BAD_REQUEST, FAILED_TO_UPDATE, "System role can not be updated");
  }

  const result = await prisma.role.update({
    where: {
      id,
    },
    data: {
      ...data,
      permissions: data.permissions
        ? {
            deleteMany: {},
            createMany: {
              data: data.permissions.map((permission) => ({
                permission_id: permission,
              })),
            },
          }
        : undefined,
    },
  });

  return result;
};

const deleteFromDB = async (id: string, user: TAdminCache) => {
  const existingRole = await prisma.role.findUnique({
    where: {
      id,
      status: {
        not: ColumnGenericStatus.DELETED,
      },
    },
    include: {
      _count: {
        select: {
          admins: true,
        },
      },
    },
  });
  if (!existingRole) {
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to delete role", "Role not found");
  }

  if (existingRole?._count?.admins > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to delete role", "Role has admins");
  }

  if (existingRole.is_system) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Failed to delete role",
      "System role can not be deleted",
    );
  }

  const result = await prisma.role.update({
    where: {
      id,
    },
    data: {
      status: ColumnGenericStatus.DELETED,
      deleted_at: new Date(),
      deleted_by: {
        connect: {
          id: user.id,
        },
      },
    },
  });

  return result;
};

const getSingleFromDB = async (id: string) => {
  let result = await prisma.role.findUnique({
    where: {
      id,
    },
    include: {
      permissions: {
        select: {
          permission: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      created_by: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          profile_image: true,
        },
      },
      _count: {
        select: {
          admins: true,
        },
      },
    },
  });

  if (!result) throw new ApiError(httpStatus.NOT_FOUND, "Role not found", "Role not found");

  result = {
    ...result,
    created_by: result.created_by
      ? { ...result.created_by, profile_image: buildImageUrl(result.created_by.profile_image) }
      : null,
  };
  return result;
};

const getAllFromDB = async (query: TRoleListQuerySchema) => {
  const where: Prisma.RoleWhereInput = {
    status: { not: ColumnGenericStatus.DELETED },
  };

  // Search
  if (query.search) {
    where.OR = [{ name: { contains: query.search, mode: "insensitive" } }];
  }

  // Status
  if (query.status) {
    where.status = query.status;
  }

  if (query.id) {
    where.id = query.id.toString();
  }

  if (query.ids?.length) {
    where.id = {
      in: query.ids.map((id) => id.toString()),
    };
  }

  const select = {
    id: true,
    name: true,
    is_system: true,
    permissions: {
      take: 2,
      select: {
        id: true,
        permission_id: true,
      },
    },
    _count: {
      select: { permissions: true },
    },
    created_at: true,
  } satisfies Prisma.RoleSelect;

  const { data, meta } = await dbQueryWithPagination<
    Prisma.RoleGetPayload<{ select: typeof select }>
  >({
    model: prisma.role,
    query,
    select,
    where,
    allowedSorts: ["name", "created_at", "id", "is_system"],
  });

  return { data, meta };
};

export const RoleService = {
  createIntoDB,
  updateIntoDB,
  deleteFromDB,
  getSingleFromDB,
  getAllFromDB,
  getAllPermissionFromDB,
};
