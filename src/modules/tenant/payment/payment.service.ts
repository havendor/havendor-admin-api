import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import { ColumnGenericStatus, Prisma } from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { CheckoutService } from "../../payment/checkout.service.js";

const listActiveMethods = async () => {
  return prisma.paymentMethod.findMany({
    where: {
      status: ColumnGenericStatus.ACTIVE,
      deleted_at: null,
    },
    orderBy: [{ sort_order: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      provider: true,
      description: true,
      required_inputs: true,
      is_default: true,
      sort_order: true,
      thumb_key: true,
      thumb_bucket: true,
    },
  });
};

const checkout = async (
  tenantId: string,
  body: {
    method_id: string;
    shop_id: string;
    plan_id: string;
    billing_interval: "MONTHLY" | "YEARLY";
    payment_info?: { hash: string; value?: string | null }[] | null;
    amount?: number | null;
  },
) => CheckoutService.checkout(tenantId, body);

const listPayments = async (tenantId: string, query: Record<string, unknown> = {}) => {
  const { shop_id, ...pagination } = query as { shop_id?: string };

  const where: Prisma.PaymentWhereInput = {
    tenant_id: tenantId,
    ...(shop_id ? { shop_id } : {}),
  };

  return dbQueryWithPagination({
    model: prisma.payment,
    query: pagination,
    where,
    allowedSorts: ["created_at", "amount", "status"],
    select: {
      id: true,
      shop_id: true,
      plan_id: true,
      method_id: true,
      provider: true,
      status: true,
      manual_verify_status: true,
      amount: true,
      currency: true,
      billing_interval: true,
      transaction_id: true,
      paid_at: true,
      failed_at: true,
      created_at: true,
      method: { select: { id: true, name: true, type: true, provider: true } },
      plan: { select: { id: true, name: true, slug: true } },
    },
  });
};

const paymentDetails = async (tenantId: string, id: string) => {
  const payment = await prisma.payment.findFirst({
    where: { id, tenant_id: tenantId },
    include: {
      method: true,
      plan: true,
      shop: { select: { id: true, shop_name: true, identity: true } },
      shop_subscription: true,
    },
  });
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};

const currentSubscription = async (tenantId: string, shopId: string) => {
  const shop = await prisma.shop.findFirst({
    where: { id: shopId, tenant_id: tenantId, deleted_at: null },
    include: {
      active_subscription: {
        include: { plan: true },
      },
    },
  });
  if (!shop) {
    throw new ApiError(httpStatus.NOT_FOUND, "Shop not found");
  }

  // Also surface blocked subscription still tied to shop history
  let subscription = shop.active_subscription;
  if (!subscription) {
    subscription = (await prisma.shopSubscription.findFirst({
      where: {
        shop_id: shopId,
        deleted_at: null,
        status: { in: ["BLOCKED", "PAST_DUE", "CANCELED"] },
      },
      include: { plan: true },
      orderBy: { updated_at: "desc" },
    })) as typeof shop.active_subscription;
  }

  return {
    shop: {
      id: shop.id,
      shop_name: shop.shop_name,
      identity: shop.identity,
    },
    subscription,
  };
};

export const TenantPaymentService = {
  listActiveMethods,
  checkout,
  listPayments,
  paymentDetails,
  currentSubscription,
};
