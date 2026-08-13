import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import {
  ManualVerifyStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "../../../generated/prisma/index.js";
import { dbQueryWithPagination, prisma } from "../../../utility/index.js";
import { ManualVerifyService } from "../../payment/manual-verify.service.js";

const list = async (query: Record<string, unknown> = {}) => {
  const {
    status,
    provider,
    manual_verify_status,
    method_id,
    shop_id,
    tenant_id,
    search,
    ...pagination
  } = query as {
    status?: PaymentStatus;
    provider?: PaymentProvider;
    manual_verify_status?: ManualVerifyStatus;
    method_id?: string;
    shop_id?: string;
    tenant_id?: string;
    search?: string;
  };

  const and: Prisma.PaymentWhereInput[] = [];
  if (status) and.push({ status });
  if (provider) and.push({ provider });
  if (manual_verify_status) and.push({ manual_verify_status });
  if (method_id) and.push({ method_id });
  if (shop_id) and.push({ shop_id });
  if (tenant_id) and.push({ tenant_id });
  if (search) {
    and.push({
      OR: [
        { id: { contains: search, mode: "insensitive" } },
        { transaction_id: { contains: search, mode: "insensitive" } },
        { provider_transaction_id: { contains: search, mode: "insensitive" } },
        { idempotency_key: { contains: search, mode: "insensitive" } },
      ],
    });
  }

  return dbQueryWithPagination({
    model: prisma.payment,
    query: pagination,
    where: and.length ? { AND: and } : {},
    allowedSorts: ["created_at", "amount", "status", "paid_at"],
    select: {
      id: true,
      tenant_id: true,
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
      provider_transaction_id: true,
      paid_at: true,
      failed_at: true,
      created_at: true,
      method: { select: { id: true, name: true, type: true, provider: true } },
      plan: { select: { id: true, name: true, slug: true } },
      shop: { select: { id: true, shop_name: true, identity: true } },
    },
  });
};

const details = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      method: true,
      plan: true,
      shop: true,
      shop_subscription: true,
      verified_by: {
        select: { id: true, first_name: true, last_name: true, email: true },
      },
    },
  });
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found");
  }
  return payment;
};

const verify = async (id: string, adminId: string, notes?: string | null) =>
  ManualVerifyService.verify(id, adminId, notes);

const reject = async (
  id: string,
  adminId: string,
  notes?: string | null,
  block_subscription = false,
) => ManualVerifyService.reject(id, adminId, notes, block_subscription);

export const AdminPaymentService = {
  list,
  details,
  verify,
  reject,
};
