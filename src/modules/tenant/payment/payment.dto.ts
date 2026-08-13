import { z } from "zod";
import { BillingInterval } from "../../../generated/prisma/index.js";

const paymentInfoItem = z.object({
  hash: z.string().min(1),
  value: z.string().nullable().optional(),
});

const checkout = z.object({
  body: z.object({
    method_id: z.string().min(1),
    shop_id: z.string().min(1),
    plan_id: z.string().min(1),
    billing_interval: z.enum(BillingInterval).default(BillingInterval.MONTHLY),
    payment_info: z.array(paymentInfoItem).optional().nullable(),
    amount: z.coerce.number().int().positive().optional().nullable(),
  }),
});

const listPayments = z.object({
  query: z
    .object({
      shop_id: z.string().optional(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      sort_by: z.string().optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

const paymentId = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const currentSubscription = z.object({
  query: z.object({
    shop_id: z.string().min(1),
  }),
});

export const TenantPaymentDto = {
  checkout,
  listPayments,
  paymentId,
  currentSubscription,
};
