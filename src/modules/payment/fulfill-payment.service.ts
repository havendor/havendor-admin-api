import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import {
  BillingInterval,
  ManualVerifyStatus,
  Payment,
  PaymentProvider,
  Prisma,
  PurchaseType,
} from "../../generated/prisma/index.js";
import { AddonActivationService } from "./addon-activation.service.js";
import { PaymentRecordService } from "./payment-record.service.js";
import { SubscriptionActivationService } from "./subscription-activation.service.js";

type FulfillExtra = {
  provider_transaction_id?: string | null;
  provider_session_id?: string | null;
  provider_payload?: Prisma.InputJsonValue | null;
  transaction_id?: string | null;
  manual_verify_status?: ManualVerifyStatus;
};

const fulfillSucceededPayment = async (
  payment: Payment,
  paymentProvider: PaymentProvider,
  extra?: FulfillExtra,
) => {
  if (payment.purchase_type === PurchaseType.ADDON) {
    if (!payment.addon_id) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Add-on payment is missing addon_id");
    }

    const activated = await AddonActivationService.activateForShop({
      shop_id: payment.shop_id,
      addon_id: payment.addon_id,
      billing_interval: payment.billing_interval as BillingInterval,
      payment_provider: paymentProvider,
      shop_addon_id: payment.shop_addon_id,
    });

    const updated = await PaymentRecordService.markSucceeded(payment.id, {
      shop_addon_id: activated.id,
      provider_transaction_id: extra?.provider_transaction_id,
      provider_session_id: extra?.provider_session_id,
      provider_payload: extra?.provider_payload,
      transaction_id: extra?.transaction_id,
      manual_verify_status: extra?.manual_verify_status,
    });

    return { type: "addon" as const, payment: updated, shop_addon: activated };
  }

  if (!payment.plan_id) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Plan payment is missing plan_id");
  }

  const activated = await SubscriptionActivationService.activateForShop({
    shop_id: payment.shop_id,
    plan_id: payment.plan_id,
    billing_interval: payment.billing_interval as BillingInterval,
    payment_provider: paymentProvider,
    shop_subscription_id: payment.shop_subscription_id,
  });

  const updated = await PaymentRecordService.markSucceeded(payment.id, {
    shop_subscription_id: activated.id,
    provider_transaction_id: extra?.provider_transaction_id,
    provider_session_id: extra?.provider_session_id,
    provider_payload: extra?.provider_payload,
    transaction_id: extra?.transaction_id,
    manual_verify_status: extra?.manual_verify_status,
  });

  return { type: "plan" as const, payment: updated, subscription: activated };
};

export const FulfillPaymentService = {
  fulfillSucceededPayment,
};
