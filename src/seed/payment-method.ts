import { Logger } from "@havendor/server-core";
import {
  ColumnGenericStatus,
  PaymentMethodType,
  PaymentProvider,
} from "../generated/prisma/index.js";
import { prisma } from "../utility/index.js";

const DEFAULT_METHODS = [
  {
    name: "Stripe",
    slug: "stripe",
    type: PaymentMethodType.AUTOMATED,
    provider: PaymentProvider.STRIPE,
    description: "Pay securely with card via Stripe",
    sort_order: 1,
    required_inputs: undefined,
  },
  {
    name: "SSLCommerz",
    slug: "sslcommerz",
    type: PaymentMethodType.AUTOMATED,
    provider: PaymentProvider.SSLCOMMERZ,
    description: "Pay with local cards, bKash, Nagad via SSLCommerz",
    sort_order: 2,
    required_inputs: undefined,
  },
  {
    name: "bKash (Manual)",
    slug: "bkash-manual",
    type: PaymentMethodType.MANUAL,
    provider: PaymentProvider.MANUAL,
    description: "Send payment to Merchant/Personal bKash and submit Transaction ID",
    sort_order: 3,
    required_inputs: [
      { name: "Transaction ID", hash: "transaction_id", type: "text", is_required: true },
      { name: "Sender Mobile", hash: "sender_mobile", type: "text", is_required: false },
    ],
  },
  {
    name: "Nagad (Manual)",
    slug: "nagad-manual",
    type: PaymentMethodType.MANUAL,
    provider: PaymentProvider.MANUAL,
    description: "Send payment to Merchant/Personal Nagad and submit Transaction ID",
    sort_order: 4,
    required_inputs: [
      { name: "Transaction ID", hash: "transaction_id", type: "text", is_required: true },
      { name: "Sender Mobile", hash: "sender_mobile", type: "text", is_required: false },
    ],
  },
  {
    name: "Bank Transfer",
    slug: "bank-transfer",
    type: PaymentMethodType.MANUAL,
    provider: PaymentProvider.MANUAL,
    description: "Transfer to Havendor bank account and submit reference/receipt",
    sort_order: 5,
    required_inputs: [
      {
        name: "Transaction / Reference ID",
        hash: "transaction_id",
        type: "text",
        is_required: true,
      },
      { name: "Account Name", hash: "account_name", type: "text", is_required: false },
    ],
  },
] as const;

export const seedPaymentMethods = async () => {
  let created = 0;
  let skipped = 0;

  for (const method of DEFAULT_METHODS) {
    const existing = await prisma.paymentMethod.findFirst({
      where: {
        slug: method.slug,
        deleted_at: null,
      },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.paymentMethod.create({
      data: {
        name: method.name,
        slug: method.slug,
        type: method.type,
        provider: method.provider,
        description: method.description,
        status: ColumnGenericStatus.ACTIVE,
        sort_order: method.sort_order,
        required_inputs: method.required_inputs ? (method.required_inputs as never) : undefined,
      },
    });
    created += 1;
  }

  if (created === 0) {
    Logger.app.info(
      `⏭️  Stage skip: Payment Methods — all payment methods already exist (${skipped} skipped)`,
    );
    return;
  }

  Logger.app.info(`✅ Stage complete: Payment Methods — ${created} created, ${skipped} skipped`);
};
