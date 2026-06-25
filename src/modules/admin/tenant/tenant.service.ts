import {
  ApiError,
  buildImageUrl,
  generatePassword,
  normalizeAndSwapImages,
} from "@havendor/server-core";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { sendMail } from "../../../email/send-mail.js";
import { tenantCreatedTemplate } from "../../../email/templates/tenant-create-template.js";
import { Prisma, Tenant, UserStatus } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { TTenantListQuery, TTenantPayload } from "./tenant.type.js";

const createIntoDB = async (payload: TTenantPayload) => {
  const isEmailExists = await prisma.tenant.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isEmailExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to signup", null, {
      email: ["Email already exists"],
    });
  }

  payload.password = generatePassword(10);

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.tenant.create({
    data: {
      ...payload,
      password: hashedPassword,
      profile_image: payload.profile_image?.key,
      profile_image_bucket: payload.profile_image?.bucket,
      present_address: {
        create: {
          ...payload.present_address,
        },
      },
      permanent_address: {
        create: {
          ...payload.permanent_address,
        },
      },
    },
    omit: { password: true },
  });

  await sendMail({
    to: user.email,
    subject: "Havendor Tenant Account Created",
    html: tenantCreatedTemplate({
      tenantName: `${user.first_name} ${user.last_name}`,
      tenantEmail: user.email,
      temporaryPassword: payload.password,
    }),
  });

  return user;
};

// Get all tenants with optional pagination (simple implementation)
const getAllFromDB = async (query: TTenantListQuery) => {
  const where: Prisma.TenantWhereInput = {
    status: { not: UserStatus.DELETED },
  };

  // Search filter
  if (query?.search) {
    where.OR = [
      { first_name: { contains: query.search, mode: "insensitive" } },
      { last_name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { mobile: { contains: query.search, mode: "insensitive" } },
    ];
  }

  // Status filter
  if (query?.status) {
    where.status = query.status;
  }

  // IDs filter
  if (query?.ids?.length) {
    where.id = { in: query.ids };
  }

  const select = {
    id: true,
    first_name: true,
    last_name: true,
    email: true,
    status: true,
    mobile: true,
    profile_image: true,
    _count: { select: { shops: true } },
  } as const;

  const { data, meta } = await dbQueryWithPagination<
    Prisma.TenantGetPayload<{ select: typeof select }>
  >({
    model: prisma.tenant,
    query,
    select,
    where,
  });

  // Transform image URLs
  const tenants = data.map((t) => ({
    ...t,
    profile_image: t.profile_image ? buildImageUrl(t.profile_image) : null,
  }));
  return { data: tenants, meta };
};

// Get single tenant by id
const getSingleFromDB = async (id: string) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      present_address: true,
      permanent_address: true,
    },
  });
  if (!tenant) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found", null);
  }
  return {
    ...tenant,
    profile_image: tenant.profile_image ? buildImageUrl(tenant.profile_image) : null,
  };
};

// Update tenant
const updateIntoDB = async (id: string, payload: Partial<TTenantPayload>) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found", null);
  }
  if (payload.email && payload.email !== existing.email) {
    const emailExists = await prisma.tenant.findUnique({ where: { email: payload.email } });
    if (emailExists) {
      throw new ApiError(httpStatus.CONFLICT, "Email already exists", null);
    }
  }

  const swappedImages = await normalizeAndSwapImages<Pick<Tenant, "profile_image">>(
    {
      profile_image: {
        key: existing.profile_image,
        bucket: existing.profile_image_bucket,
      },
    },
    {
      profile_image: {
        key: payload.profile_image?.key,
        bucket: payload.profile_image?.bucket,
      },
    },
  );

  const data: Prisma.TenantUpdateInput = {
    ...payload,
    profile_image: swappedImages.profile_image?.key,
    profile_image_bucket: swappedImages.profile_image?.bucket,
    present_address: payload.present_address
      ? {
          upsert: {
            create: payload.present_address,
            update: payload.present_address,
          },
        }
      : undefined,
    permanent_address: payload.permanent_address
      ? {
          upsert: {
            create: payload.permanent_address,
            update: payload.permanent_address,
          },
        }
      : undefined,
  };
  if (payload.password) {
    const hashed = await bcrypt.hash(payload.password, 12);
    data.password = hashed;
  }
  const updated = await prisma.tenant.update({
    where: { id },
    data,
    omit: { password: true },
  });
  return updated;
};

// Soft delete tenant
const deleteFromDB = async (id: string) => {
  const existing = await prisma.tenant.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Tenant not found", null);
  }
  const deleted = await prisma.tenant.update({
    where: { id },
    data: {
      status: UserStatus.DELETED,
      deleted_at: new Date(),
    },
    omit: { password: true },
  });

  await prisma.tenantSession.deleteMany({ where: { tenant_id: id } });

  return deleted;
};

export const TenantService = {
  createIntoDB,
  getAllFromDB,
  getSingleFromDB,
  updateIntoDB,
  deleteFromDB,
};
