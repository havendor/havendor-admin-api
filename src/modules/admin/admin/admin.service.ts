import {
  ApiError,
  buildImageUrl,
  generatePassword,
  getSignedFileUrl,
  normalizeAndSwapImages,
} from "@havendor/server-core";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { cacheAdmin } from "../../../cache/admin";
import { sendMail } from "../../../email/send-mail";
import { adminCreatedTemplate } from "../../../email/templates";
import { adminResetPasswordTemplate } from "../../../email/templates/admin-reset-password.template";
import { Admin, Prisma, UserStatus } from "../../../generated/prisma";
import { createAdminEmployeeId } from "../../../utility/createAdminEmployeeId";
import { dbQueryWithPagination } from "../../../utility/dbQueryWithPagination";
import { prisma } from "../../../utility/prisma";
import { TAdminCache, TAdminInputSchema, TAdminListQuey, TAdminUpdateSchema } from "./admin.type";

const createIntoDB = async (payload: TAdminInputSchema) => {
  return prisma.$transaction(
    async (tx) => {
      const employeeId = await createAdminEmployeeId(tx);
      const password = generatePassword(12);

      const hashedPassword = await bcrypt.hash(password, 10);

      const { role_id, ...rest } = payload;

      const isEmailExist = await tx.admin.findUnique({
        where: { email: rest.email },
      });

      if (isEmailExist) {
        throw new ApiError(httpStatus.CONFLICT, "Failed to create Admin.", null, {
          email: ["Email already exists"],
        });
      }

      const data: Prisma.AdminCreateInput = {
        ...rest,
        profile_image: rest?.profile_image?.key,
        profile_image_bucket: rest?.profile_image?.bucket,
        identity_document: rest?.identity_document?.key,
        identity_document_bucket: rest?.identity_document?.bucket,
        employee_id: employeeId,
        password: hashedPassword,
        role: { connect: { id: role_id } },
        present_address: {
          create: {
            ...rest.present_address,
          },
        },
        permanent_address: {
          create: {
            ...rest.permanent_address,
          },
        },
      };

      await sendMail({
        to: rest.email,
        subject: "Admin Account Created",
        html: adminCreatedTemplate({
          adminName: `${rest.first_name} ${rest.last_name}`,
          adminEmail: rest.email,
          temporaryPassword: password,
        }),
      });

      const admin = await tx.admin.create({ data, omit: { password: true } });

      return admin;
    },
    { timeout: 50000 },
  );
};

const updateIntoDB = async (payload: TAdminUpdateSchema, id: string) => {
  return prisma.$transaction(
    async (tx) => {
      const { role_id, ...rest } = payload;

      const [existAdmin, isEmailExist] = await Promise.all([
        tx.admin.findUnique({
          where: { id },
        }),
        tx.admin.findUnique({
          where: { email: rest.email, NOT: { id } },
        }),
      ]);

      if (!existAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found", null);
      }

      if (isEmailExist) {
        throw new ApiError(httpStatus.CONFLICT, "Failed to update Admin.", null, {
          email: ["Email already exists"],
        });
      }

      const swappedImages = await normalizeAndSwapImages<
        Pick<Admin, "profile_image" | "identity_document">
      >(
        {
          profile_image: {
            key: existAdmin.profile_image,
            bucket: existAdmin.profile_image_bucket,
          },
          identity_document: {
            key: existAdmin.identity_document,
            bucket: existAdmin.identity_document_bucket,
          },
        },
        {
          profile_image: {
            key: rest.profile_image?.key,
            bucket: rest.profile_image?.bucket,
          },
          identity_document: {
            key: rest.identity_document?.key,
            bucket: rest.identity_document?.bucket,
          },
        },
      );

      const data: Prisma.AdminUpdateInput = {
        ...rest,
        profile_image: swappedImages.profile_image?.key,
        profile_image_bucket: swappedImages.profile_image?.bucket,
        identity_document: swappedImages.identity_document?.key,
        identity_document_bucket: swappedImages.identity_document?.bucket,
        role: { connect: { id: role_id } },
        present_address: {
          upsert: {
            create: {
              ...rest.present_address,
            },
            update: {
              ...rest.present_address,
            },
          },
        },
        permanent_address: {
          upsert: {
            create: {
              ...rest.permanent_address,
            },
            update: {
              ...rest.permanent_address,
            },
          },
        },
      };

      const admin = await tx.admin.update({
        where: { id },
        data,
        omit: { password: true },
      });
      await cacheAdmin.deleteAdmin(id);
      return admin;
    },
    { timeout: 50000 },
  );
};

const deleteFromDB = async (id: string, authUser: TAdminCache) => {
  return prisma.$transaction(
    async (tx) => {
      const existAdmin = await tx.admin.findUnique({
        where: { id },
      });

      if (!existAdmin) {
        throw new ApiError(httpStatus.NOT_FOUND, "Admin not found", null);
      }

      if (existAdmin.is_system)
        throw new ApiError(httpStatus.FORBIDDEN, "System Admin can not be deleted", null);

      if (existAdmin.status === UserStatus.DELETED)
        throw new ApiError(httpStatus.BAD_REQUEST, "Admin already deleted", null);

      const [admin] = await Promise.all([
        tx.admin.update({
          where: { id },
          data: {
            status: UserStatus.DELETED,
            deleted_at: new Date(),
            deleted_by: { connect: { id: authUser.id } },
          },
          omit: { password: true },
        }),
        tx.adminSession.deleteMany({ where: { admin_id: existAdmin.id } }),
      ]);

      return admin;
    },
    { timeout: 50000 },
  );
};

const readAllFromDB = async (query: TAdminListQuey) => {
  const where: Prisma.AdminWhereInput = {
    status: { not: UserStatus.DELETED },
  };

  // Search
  if (query.search) {
    where.OR = [
      { first_name: { contains: query.search, mode: "insensitive" } },
      { last_name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { mobile: { contains: query.search, mode: "insensitive" } },
    ];
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
    employee_id: true,
    first_name: true,
    last_name: true,
    email: true,
    mobile: true,
    status: true,
    profile_image: true,
    created_at: true,
  } satisfies Prisma.AdminSelect;

  const { data, meta } = await dbQueryWithPagination<
    Prisma.AdminGetPayload<{ select: typeof select }>
  >({
    model: prisma.admin,
    query,
    select,
    where,
  });

  const admins = data.map((admin) => ({
    ...admin,
    profile_image: buildImageUrl(admin.profile_image),
  }));

  return { data: admins, meta };
};

const getSingleFromDB = async (id: string) => {
  let admin = await prisma.admin.findUnique({
    where: { id },
    omit: {
      password: true,
      profile_image_bucket: true,
      role_id: true,
      created_by_id: true,
      deleted_by_id: true,
      terminated_by_id: true,
      present_address_id: true,
      permanent_address_id: true,
    },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            omit: {
              permission_id: true,
              role_id: true,
            },
          },
        },
        omit: {
          description: true,
          created_at: true,
          updated_at: true,
          created_by_id: true,
        },
      },
      deleted_by: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_image: true,
        },
      },
      terminated_by: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_image: true,
        },
      },
      created_by: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          profile_image: true,
        },
      },
      present_address: true,
      permanent_address: true,
      sessions: {
        omit: {
          refresh_token_hash: true,
          admin_id: true,
        },
      },
    },
  });

  if (!admin)
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to retrieve admin.", "Admin not found.");

  const identityDocument = await getSignedFileUrl({
    bucket: admin.identity_document_bucket,
    key: admin.identity_document,
  });

  admin = {
    ...admin,
    identity_document_bucket: null,
    profile_image: buildImageUrl(admin.profile_image),
    identity_document: identityDocument,
    deleted_by: admin.deleted_by
      ? {
          ...admin.deleted_by,
          profile_image: buildImageUrl(admin.deleted_by?.profile_image),
        }
      : null,
    terminated_by: admin.terminated_by
      ? {
          ...admin.terminated_by,
          profile_image: buildImageUrl(admin.terminated_by?.profile_image),
        }
      : null,
    created_by: admin.created_by
      ? {
          ...admin.created_by,
          profile_image: buildImageUrl(admin.created_by?.profile_image),
        }
      : null,
  };

  return admin;
};

const getOptionsFromDB = async () => {
  let admins = await prisma.admin.findMany({
    where: {
      status: { in: [UserStatus.ACTIVE, UserStatus.INACTIVE] },
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      status: true,
      is_system: true,
      profile_image: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  admins = admins.map((admin) => ({
    ...admin,
    profile_image: buildImageUrl(admin.profile_image),
  }));

  return admins;
};

const resetPasswordIntoDB = async (id: string) => {
  return prisma.$transaction(
    async (tx) => {
      const existAdmin = await tx.admin.findUnique({
        where: { id, status: { in: [UserStatus.ACTIVE, UserStatus.INACTIVE] } },
      });

      if (!existAdmin)
        throw new ApiError(
          httpStatus.NOT_FOUND,
          "Failed to reset admin password",
          "Admin not found",
        );

      const newPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const [admin] = await Promise.all([
        tx.admin.update({
          where: { id },
          data: {
            password: hashedPassword,
            status: "NEEDS_PASSWORD_CHANGE",
            updated_at: new Date(),
          },
          omit: { password: true },
        }),
        tx.adminSession.deleteMany({ where: { admin_id: existAdmin.id } }),
        cacheAdmin.deleteAdmin(id),
        sendMail({
          to: existAdmin.email,
          subject: "Password Reset",
          html: adminResetPasswordTemplate({
            adminName: `${existAdmin.first_name} ${existAdmin.last_name}`,
            adminEmail: existAdmin.email,
            newPassword,
          }),
        }),
      ]);

      return { ...admin };
    },
    {
      timeout: 50000,
    },
  );
};

export const AdminService = {
  createIntoDB,
  updateIntoDB,
  deleteFromDB,
  readAllFromDB,
  getOptionsFromDB,
  getSingleFromDB,
  resetPasswordIntoDB,
};
