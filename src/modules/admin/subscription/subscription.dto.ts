import { z } from "zod";

const single = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const block = z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({
    reason: z.string().min(1, { error: "Reason is required" }),
  }),
});

const list = z.object({
  query: z
    .object({
      shop_id: z.string().optional(),
      status: z.string().optional(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      sort_by: z.string().optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

export const AdminSubscriptionDto = {
  single,
  block,
  list,
  unblock: single,
};
