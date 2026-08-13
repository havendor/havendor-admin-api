import { z } from "zod";
import {
  ManualVerifyStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../../generated/prisma/index.js";

const list = z.object({
  query: z
    .object({
      status: z.enum(PaymentStatus).optional(),
      provider: z.enum(PaymentProvider).optional(),
      manual_verify_status: z.enum(ManualVerifyStatus).optional(),
      method_id: z.string().optional(),
      shop_id: z.string().optional(),
      tenant_id: z.string().optional(),
      search: z.string().optional(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      sort_by: z.string().optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

const single = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const verify = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    notes: z.string().optional().nullable(),
  }),
});

const reject = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    notes: z.string().optional().nullable(),
    block_subscription: z.boolean().optional().default(false),
  }),
});

export const AdminPaymentDto = {
  list,
  single,
  verify,
  reject,
};
