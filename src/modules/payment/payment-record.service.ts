import {
  ManualVerifyStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";

type CreatePendingInput = {
  tenant_id: string;
  shop_id: string;
  plan_id: string;
  method_id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  billing_interval: Prisma.PaymentCreateInput["billing_interval"];
  idempotency_key: string;
  shop_subscription_id?: string | null;
  payment_info?: Prisma.InputJsonValue | null;
  transaction_id?: string | null;
  provider_session_id?: string | null;
  provider_transaction_id?: string | null;
  provider_payload?: Prisma.InputJsonValue | null;
  notes?: string | null;
  status?: PaymentStatus;
  manual_verify_status?: ManualVerifyStatus;
  paid_at?: Date | null;
};

const createPending = async (data: CreatePendingInput): Promise<Payment> => {
  const existing = await prisma.payment.findUnique({
    where: { idempotency_key: data.idempotency_key },
  });
  if (existing) return existing;

  return prisma.payment.create({
    data: {
      tenant_id: data.tenant_id,
      shop_id: data.shop_id,
      plan_id: data.plan_id,
      method_id: data.method_id,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      billing_interval: data.billing_interval,
      idempotency_key: data.idempotency_key,
      shop_subscription_id: data.shop_subscription_id ?? null,
      payment_info: data.payment_info ?? Prisma.JsonNull,
      transaction_id: data.transaction_id ?? null,
      provider_session_id: data.provider_session_id ?? null,
      provider_transaction_id: data.provider_transaction_id ?? null,
      provider_payload: data.provider_payload ?? Prisma.JsonNull,
      notes: data.notes ?? null,
      status: data.status ?? PaymentStatus.PENDING,
      manual_verify_status: data.manual_verify_status ?? ManualVerifyStatus.PENDING,
      paid_at: data.paid_at ?? null,
    },
  });
};

const markSucceeded = async (
  paymentId: string,
  extra?: {
    provider_transaction_id?: string | null;
    provider_session_id?: string | null;
    provider_payload?: Prisma.InputJsonValue | null;
    transaction_id?: string | null;
    shop_subscription_id?: string | null;
    manual_verify_status?: ManualVerifyStatus;
  },
) => {
  const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!existing) return null;
  if (existing.status === PaymentStatus.SUCCEEDED) return existing;

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.SUCCEEDED,
      paid_at: new Date(),
      failed_at: null,
      failure_code: null,
      failure_message: null,
      provider_transaction_id: extra?.provider_transaction_id ?? existing.provider_transaction_id,
      provider_session_id: extra?.provider_session_id ?? existing.provider_session_id,
      provider_payload: extra?.provider_payload ?? undefined,
      transaction_id: extra?.transaction_id ?? existing.transaction_id,
      shop_subscription_id: extra?.shop_subscription_id ?? existing.shop_subscription_id,
      manual_verify_status: extra?.manual_verify_status ?? existing.manual_verify_status,
    },
  });
};

const markFailed = async (
  paymentId: string,
  failure?: {
    failure_code?: string | null;
    failure_message?: string | null;
    provider_payload?: Prisma.InputJsonValue | null;
    provider_transaction_id?: string | null;
  },
) => {
  const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!existing) return null;
  if (existing.status === PaymentStatus.SUCCEEDED) return existing;

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: PaymentStatus.FAILED,
      failed_at: new Date(),
      failure_code: failure?.failure_code ?? null,
      failure_message: failure?.failure_message ?? null,
      provider_payload: failure?.provider_payload ?? undefined,
      provider_transaction_id: failure?.provider_transaction_id ?? existing.provider_transaction_id,
    },
  });
};

const findByIdempotencyKey = (key: string) =>
  prisma.payment.findUnique({ where: { idempotency_key: key } });

const findByProviderTransaction = (provider: PaymentProvider, provider_transaction_id: string) =>
  prisma.payment.findFirst({
    where: { provider, provider_transaction_id },
  });

export const PaymentRecordService = {
  createPending,
  markSucceeded,
  markFailed,
  findByIdempotencyKey,
  findByProviderTransaction,
};
