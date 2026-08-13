import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import {
  ColumnGenericStatus,
  PaymentMethodType,
  PaymentProvider,
  Prisma,
} from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { createSlug } from "../../payment/utils.js";
import { TAdminCache } from "../admin/admin.type.js";

type CreateBody = {
  name: string;
  description?: string | null;
  thumb_key?: string | null;
  type?: PaymentMethodType;
  provider?: PaymentProvider;
  status?: ColumnGenericStatus;
  is_default?: boolean;
  sort_order?: number;
  required_inputs?: unknown;
};

const create = async (payload: CreateBody) => {
  const type = payload.type || PaymentMethodType.MANUAL;
  const provider =
    type === PaymentMethodType.AUTOMATED ? payload.provider! : PaymentProvider.MANUAL;
  const slug = createSlug(payload.name);

  const taken = await prisma.paymentMethod.findMany({
    where: {
      OR: [{ slug }, { name: payload.name }],
      deleted_at: null,
      status: { not: ColumnGenericStatus.DELETED },
    },
  });

  if (taken.length) {
    const bySlug = taken.find((d) => d.slug === slug);
    if (bySlug) {
      throw new ApiError(httpStatus.CONFLICT, "Failed to create payment method", null, {
        slug: ["A payment method already exists with this slug."],
      });
    }
    throw new ApiError(httpStatus.CONFLICT, "Failed to create payment method", null, {
      name: ["A payment method already exists with this name."],
    });
  }

  if (payload.is_default === true) {
    await prisma.paymentMethod.updateMany({
      where: { deleted_at: null },
      data: { is_default: false },
    });
  }

  return prisma.paymentMethod.create({
    data: {
      name: payload.name,
      slug,
      type,
      provider,
      description: payload.description ?? null,
      thumb_key: payload.thumb_key ?? null,
      status: payload.status || ColumnGenericStatus.ACTIVE,
      is_default: payload.is_default ?? false,
      sort_order: payload.sort_order ?? 1,
      required_inputs:
        type === PaymentMethodType.AUTOMATED
          ? Prisma.JsonNull
          : ((payload.required_inputs as Prisma.InputJsonValue) ?? Prisma.JsonNull),
    },
  });
};

const list = async (query: Record<string, unknown> = {}) => {
  const { search, type, status, provider, ...pagination } = query as {
    search?: string;
    type?: PaymentMethodType;
    status?: ColumnGenericStatus;
    provider?: PaymentProvider;
    page?: number;
    limit?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
  };

  const and: Prisma.PaymentMethodWhereInput[] = [
    status ? { status } : { status: { not: ColumnGenericStatus.DELETED } },
  ];

  if (search) {
    and.push({
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  if (type) and.push({ type });
  if (provider) and.push({ provider });

  return dbQueryWithPagination({
    model: prisma.paymentMethod,
    query: pagination,
    where: { AND: and },
    allowedSorts: ["created_at", "name", "sort_order", "status"],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      provider: true,
      description: true,
      status: true,
      is_default: true,
      sort_order: true,
      thumb_key: true,
      thumb_bucket: true,
      created_at: true,
      updated_at: true,
    },
  });
};

const details = async (id: string) => {
  const result = await prisma.paymentMethod.findFirst({
    where: {
      id,
      status: { not: ColumnGenericStatus.DELETED },
    },
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "No payment method found.");
  }
  return result;
};

const update = async (id: string, payload: Partial<CreateBody>) => {
  const existing = await prisma.paymentMethod.findFirst({
    where: {
      id,
      status: { in: [ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE] },
      deleted_at: null,
    },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to update payment method.", "Not found");
  }

  if (payload.is_default === true) {
    await prisma.paymentMethod.updateMany({
      where: { deleted_at: null, id: { not: id } },
      data: { is_default: false },
    });
  }

  const type = payload.type ?? existing.type;
  let provider = payload.provider ?? existing.provider;
  if (type === PaymentMethodType.MANUAL) provider = PaymentProvider.MANUAL;
  if (type === PaymentMethodType.AUTOMATED && (provider === PaymentProvider.MANUAL || !provider)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Automated methods require STRIPE or SSLCOMMERZ");
  }

  return prisma.paymentMethod.update({
    where: { id },
    data: {
      name: payload.name,
      description: payload.description,
      thumb_key: payload.thumb_key,
      type,
      provider,
      status: payload.status,
      is_default: payload.is_default,
      sort_order: payload.sort_order,
      required_inputs:
        type === PaymentMethodType.AUTOMATED
          ? Prisma.JsonNull
          : payload.required_inputs !== undefined
            ? (payload.required_inputs as Prisma.InputJsonValue)
            : undefined,
    },
  });
};

const softDelete = async (id: string, user: TAdminCache) => {
  const prev = await prisma.paymentMethod.findFirst({
    where: { id, status: { not: ColumnGenericStatus.DELETED } },
  });
  if (!prev) {
    throw new ApiError(httpStatus.NOT_FOUND, "Failed to delete payment method.", "Not found");
  }

  return prisma.paymentMethod.update({
    where: { id },
    data: {
      name: `${prev.name} - Deleted - ${crypto.randomUUID()}`,
      slug: `${prev.slug}-deleted-${crypto.randomUUID().slice(0, 8)}`,
      status: ColumnGenericStatus.DELETED,
      deleted_at: new Date(),
      deleted_by_id: user.id,
      is_default: false,
    },
  });
};

export const PaymentMethodService = {
  create,
  list,
  details,
  update,
  softDelete,
};
