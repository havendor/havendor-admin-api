import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import { Prisma, SubscriptionStatus } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { SubscriptionBlockService } from "../../payment/subscription-block.service.js";

const list = async (query: Record<string, unknown> = {}) => {
  const { shop_id, status, ...pagination } = query as {
    shop_id?: string;
    status?: string;
  };

  const where: Prisma.ShopSubscriptionWhereInput = {
    deleted_at: null,
    ...(shop_id ? { shop_id } : {}),
    ...(status ? { status: status as SubscriptionStatus } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.shopSubscription,
    query: pagination,
    where,
    allowedSorts: ["created_at", "current_period_end", "status"],
    select: {
      id: true,
      shop_id: true,
      plan_id: true,
      status: true,
      billing_interval: true,
      current_period_start: true,
      current_period_end: true,
      payment_provider: true,
      blocked_at: true,
      blocked_reason: true,
      created_at: true,
      plan: { select: { id: true, name: true, slug: true } },
      shop: { select: { id: true, shop_name: true, identity: true, tenant_id: true } },
    },
  });
};

const details = async (id: string) => {
  const subscription = await prisma.shopSubscription.findFirst({
    where: { id, deleted_at: null },
    include: {
      plan: {
        include: {
          plan_features: {
            include: { feature: true },
          },
        },
      },
      shop: {
        select: {
          id: true,
          shop_name: true,
          identity: true,
          tenant_id: true,
          tenant: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              mobile: true,
            },
          },
        },
      },
      blocked_by: {
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
      stripe_subscription: true,
      payments: {
        take: 10,
        orderBy: { created_at: "desc" },
      },
    },
  });

  if (!subscription) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
  }

  return subscription;
};

const block = async (id: string, reason: string, adminId: string) => {
  const result = await SubscriptionBlockService.block(id, reason, adminId);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  return result;
};

const unblock = async (id: string) => {
  const result = await SubscriptionBlockService.unblock(id);
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, "Subscription not found");
  }
  if ("error" in result && result.error === "period_ended") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot unblock — billing period has ended",
      "Subscription period ended",
    );
  }
  return "subscription" in result ? result.subscription : result;
};

export const AdminSubscriptionService = {
  list,
  details,
  block,
  unblock,
};
