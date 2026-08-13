import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import {
  ManualVerifyStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../generated/prisma/index.js";
import { prisma } from "../../utility/index.js";
import { PaymentRecordService } from "./payment-record.service.js";
import { SubscriptionActivationService } from "./subscription-activation.service.js";
import { SubscriptionBlockService } from "./subscription-block.service.js";

const verify = async (paymentId: string, adminId: string, notes?: string | null) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { method: true },
  });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found", "Payment not found");
  }

  if (payment.manual_verify_status === ManualVerifyStatus.VERIFIED) {
    return payment;
  }

  let shopSubscriptionId = payment.shop_subscription_id;

  if (payment.provider === PaymentProvider.MANUAL && payment.status !== PaymentStatus.SUCCEEDED) {
    const activated = await SubscriptionActivationService.activateForShop({
      shop_id: payment.shop_id,
      plan_id: payment.plan_id,
      billing_interval: payment.billing_interval,
      payment_provider: PaymentProvider.MANUAL,
      shop_subscription_id: payment.shop_subscription_id,
    });
    shopSubscriptionId = activated.id;

    await PaymentRecordService.markSucceeded(payment.id, {
      shop_subscription_id: shopSubscriptionId,
      manual_verify_status: ManualVerifyStatus.VERIFIED,
    });
  }

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      manual_verify_status: ManualVerifyStatus.VERIFIED,
      verified_at: new Date(),
      verified_by_admin_id: adminId,
      verify_notes: notes ?? null,
      shop_subscription_id: shopSubscriptionId,
      status:
        payment.provider === PaymentProvider.MANUAL ? PaymentStatus.SUCCEEDED : payment.status,
      paid_at:
        payment.provider === PaymentProvider.MANUAL
          ? (payment.paid_at ?? new Date())
          : payment.paid_at,
    },
    include: {
      method: true,
      plan: true,
      shop: true,
    },
  });
};

const reject = async (
  paymentId: string,
  adminId: string,
  notes?: string | null,
  blockSubscription = false,
) => {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, "Payment not found", "Payment not found");
  }

  const updated = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      manual_verify_status: ManualVerifyStatus.REJECTED,
      verified_at: new Date(),
      verified_by_admin_id: adminId,
      verify_notes: notes ?? null,
      status:
        payment.provider === PaymentProvider.MANUAL && payment.status === PaymentStatus.PENDING
          ? PaymentStatus.FAILED
          : payment.status,
      failed_at:
        payment.provider === PaymentProvider.MANUAL && payment.status === PaymentStatus.PENDING
          ? new Date()
          : payment.failed_at,
    },
    include: {
      method: true,
      plan: true,
      shop: true,
    },
  });

  if (blockSubscription && payment.shop_subscription_id) {
    await SubscriptionBlockService.block(
      payment.shop_subscription_id,
      notes || "Payment rejected by admin",
      adminId,
    );
  }

  return updated;
};

export const ManualVerifyService = {
  verify,
  reject,
};
