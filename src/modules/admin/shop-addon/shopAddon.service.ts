import { ApiError } from "@havendor/server-core";
import { TPaginationQuery } from "@havendor/types";
import httpStatus from "http-status";
import { Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { AddonBlockService } from "../../payment/addon-block.service.js";

const list = async (query: Record<string, unknown> = {}) => {
  const { shop_id, addon_id, status, ...pagination } = query as {
    shop_id?: string;
    addon_id?: string;
    status?: string;
  };
  const where: Prisma.ShopAddonWhereInput = {
    deleted_at: null,
    ...(shop_id ? { shop_id } : {}),
    ...(addon_id ? { addon_id } : {}),
    ...(status ? { status: status as never } : {}),
  };
  return dbQueryWithPagination({
    model: prisma.shopAddon,
    query: pagination as TPaginationQuery,
    where,
    allowedSorts: ["created_at", "updated_at", "status", "current_period_end"],
    select: {
      id: true,
      shop_id: true,
      addon_id: true,
      status: true,
      billing_interval: true,
      current_period_start: true,
      current_period_end: true,
      blocked_at: true,
      blocked_reason: true,
      created_at: true,
      shop: { select: { id: true, shop_name: true, identity: true } },
      addon: { select: { id: true, slug: true, name: true } },
    },
  });
};

const details = async (id: string) => {
  const row = await prisma.shopAddon.findFirst({
    where: { id, deleted_at: null },
    include: {
      shop: { select: { id: true, shop_name: true, identity: true, tenant_id: true } },
      addon: true,
      blocked_by: { select: { id: true, first_name: true, last_name: true, email: true } },
    },
  });
  if (!row) throw new ApiError(httpStatus.NOT_FOUND, "Shop add-on not found.");
  return row;
};

const block = async (id: string, adminId: string, reason?: string | null) =>
  AddonBlockService.block(id, adminId, reason);

const unblock = async (id: string) => AddonBlockService.unblock(id);

export const ShopAddonService = { list, details, block, unblock };
