import { Logger } from "@havendor/server-core";
import {
  ColumnGenericStatus,
  PaymentMethodType,
  PaymentProvider,
} from "../generated/prisma/index.js";
import { prisma } from "../utility/index.js";

const GATEWAY_METHODS = [
  {
    name: "Stripe",
    slug: "stripe",
    type: PaymentMethodType.AUTOMATED,
    provider: PaymentProvider.STRIPE,
    description: "Pay securely with card via Stripe",
    sort_order: 1,
  },
  {
    name: "SSLCommerz",
    slug: "sslcommerz",
    type: PaymentMethodType.AUTOMATED,
    provider: PaymentProvider.SSLCOMMERZ,
    description: "Pay with local cards, bKash, Nagad via SSLCommerz",
    sort_order: 2,
  },
] as const;

export const seedPaymentMethods = async () => {
  let created = 0;
  let skipped = 0;

  for (const method of GATEWAY_METHODS) {
    const existing = await prisma.paymentMethod.findFirst({
      where: {
        OR: [
          { slug: method.slug },
          { provider: method.provider, type: PaymentMethodType.AUTOMATED },
        ],
        status: { not: ColumnGenericStatus.DELETED },
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
        required_inputs: undefined,
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
