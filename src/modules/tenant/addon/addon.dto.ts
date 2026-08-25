import { z } from "zod";
import { BillingInterval } from "../../../generated/prisma/index.js";

const paymentInfoItem = z.object({
  hash: z.string().min(1),
  value: z.string().nullable().optional(),
});

export const TenantAddonDto = {
  active: z.object({ query: z.object({ shop_id: z.string().min(1) }) }),
  checkout: z.object({
    body: z.object({
      method_id: z.string().min(1),
      shop_id: z.string().min(1),
      addon_id: z.string().min(1),
      billing_interval: z.enum(BillingInterval).default(BillingInterval.MONTHLY),
      payment_info: z.array(paymentInfoItem).optional().nullable(),
      amount: z.coerce.number().int().positive().optional().nullable(),
    }),
  }),
};
