import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { resolve4, resolveCname } from "node:dns/promises";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import {
  TShopDomainCreateInput,
  TShopDomainListQuery,
  TShopDomainSslInput,
  TShopDomainUpdateInput,
} from "./shopDomain.type.js";

const create = async (payload: TShopDomainCreateInput) => {
  const shop = await prisma.shop.findFirst({
    where: { id: payload.shop_id, deleted_at: null },
  });
  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found.");
  }

  const existingDomain = await prisma.shopDomain.findFirst({
    where: { domain: payload.domain, deleted_at: null },
  });
  if (existingDomain) {
    throw new ApiError(httpStatus.CONFLICT, "Domain is already registered.");
  }

  if (payload.is_primary) {
    await prisma.shopDomain.updateMany({
      where: { shop_id: payload.shop_id, is_primary: true, deleted_at: null },
      data: { is_primary: false },
    });
  }

  return prisma.shopDomain.create({
    data: {
      shop_id: payload.shop_id,
      domain: payload.domain,
      type: payload.type,
      is_primary: payload.is_primary ?? false,
      dns_target: payload.dns_target ?? null,
      status: payload.status || "PENDING",
    },
  });
};

const list = async (query: TShopDomainListQuery = {} as TShopDomainListQuery) => {
  const { search, shop_id, type, status, ssl_status, is_primary, dns_verified, ...pagination } =
    query;

  const where: Prisma.ShopDomainWhereInput = {
    deleted_at: null,
    ...(search ? { domain: { contains: search, mode: "insensitive" } } : {}),
    ...(shop_id ? { shop_id } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
    ...(ssl_status ? { ssl_status } : {}),
    ...(typeof is_primary === "boolean" ? { is_primary } : {}),
    ...(typeof dns_verified === "boolean" ? { dns_verified } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.shopDomain,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: ["created_at", "updated_at", "domain", "status", "ssl_status", "last_checked_at"],
    select: {
      id: true,
      shop_id: true,
      domain: true,
      type: true,
      is_primary: true,
      status: true,
      dns_target: true,
      dns_verified: true,
      dns_verified_at: true,
      ssl_status: true,
      ssl_enabled: true,
      ssl_expires_at: true,
      last_checked_at: true,
      error_message: true,
      created_at: true,
      updated_at: true,
      shop: {
        select: {
          id: true,
          shop_name: true,
          identity: true,
        },
      },
    },
  });
};

const details = async (id: string) => {
  const domain = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
    include: {
      shop: {
        select: {
          id: true,
          shop_name: true,
          identity: true,
          tenant_id: true,
        },
      },
    },
  });

  if (!domain) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  return domain;
};

const update = async (id: string, payload: TShopDomainUpdateInput) => {
  const existing = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  if (payload.domain && payload.domain !== existing.domain) {
    const conflict = await prisma.shopDomain.findFirst({
      where: { domain: payload.domain, NOT: { id }, deleted_at: null },
    });
    if (conflict) {
      throw new ApiError(httpStatus.CONFLICT, "Domain is already registered.");
    }
  }

  return prisma.shopDomain.update({
    where: { id },
    data: payload,
  });
};

const softDelete = async (id: string) => {
  const existing = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  return prisma.shopDomain.update({
    where: { id },
    data: {
      deleted_at: new Date(),
      is_primary: false,
    },
  });
};

const verifyDns = async (id: string) => {
  const existing = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  let verified = false;
  let errorMessage: string | null = null;

  try {
    if (existing.type === "SUBDOMAIN") {
      verified = true;
    } else {
      try {
        const cnames = await resolveCname(existing.domain);
        if (
          cnames.some(
            (target) =>
              existing.dns_target &&
              target.toLowerCase().includes(existing.dns_target.toLowerCase()),
          )
        ) {
          verified = true;
        } else if (cnames.length > 0) {
          verified = true;
        }
      } catch (_err: unknown) {
        try {
          const ips = await resolve4(existing.domain);
          if (ips.length > 0) {
            verified = true;
          }
        } catch (innerErr: unknown) {
          const errObj = innerErr as Error;
          errorMessage = errObj.message || "DNS lookup failed";
        }
      }
    }
  } catch (err: unknown) {
    const errObj = err as Error;
    errorMessage = errObj.message || "DNS verification error";
  }

  const now = new Date();
  return prisma.shopDomain.update({
    where: { id },
    data: {
      dns_verified: verified,
      dns_verified_at: verified ? now : existing.dns_verified_at,
      last_checked_at: now,
      status: verified ? "VERIFIED" : "FAILED",
      error_message: verified ? null : errorMessage || "DNS record mismatch",
    },
  });
};

const setPrimary = async (id: string) => {
  const existing = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.shopDomain.updateMany({
      where: { shop_id: existing.shop_id, is_primary: true, NOT: { id }, deleted_at: null },
      data: { is_primary: false },
    });

    return tx.shopDomain.update({
      where: { id },
      data: { is_primary: true },
    });
  });
};

const manageSsl = async (id: string, payload: TShopDomainSslInput) => {
  const existing = await prisma.shopDomain.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop domain not found.");
  }

  return prisma.shopDomain.update({
    where: { id },
    data: {
      ssl_status: payload.ssl_status,
      ssl_enabled: payload.ssl_enabled ?? existing.ssl_enabled,
      ssl_expires_at: payload.ssl_expires_at ?? existing.ssl_expires_at,
    },
  });
};

export const ShopDomainService = {
  create,
  list,
  details,
  update,
  softDelete,
  verifyDns,
  setPrimary,
  manageSsl,
};
