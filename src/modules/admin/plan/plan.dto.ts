import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { PlanSlug } from "../../../generated/prisma/index.js";

const planBaseSchema = z.object({
  slug: z.enum(PlanSlug, { error: "Plan slug is required." }),
  name: z
    .string({ error: "Plan name is required." })
    .min(1, { message: "Plan name cannot be empty." }),
  description: z.string().nullish(),
  is_active: z.boolean().optional().default(true),
  price_monthly: z.coerce.number().int().min(0, { message: "Monthly price must be non-negative." }),
  price_yearly: z.coerce.number().int().min(0, { message: "Yearly price must be non-negative." }),
  max_orders_per_month: z.coerce.number().int().nullish(),
  max_storage_bytes: z.coerce.number().nullish(),
  max_staff_accounts: z.coerce.number().int().nullish(),
  max_custom_pages: z.coerce.number().int().nullish(),
  can_use_custom_domain: z.boolean().optional().default(false),
  can_setup_gtm: z.boolean().optional().default(false),
  can_access_advanced_dash: z.boolean().optional().default(false),
  can_use_webhooks: z.boolean().optional().default(false),
  can_use_api: z.boolean().optional().default(false),
  can_use_advanced_analytics: z.boolean().optional().default(false),
  has_priority_support: z.boolean().optional().default(false),
});

const create = z.object({
  body: planBaseSchema,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Plan ID is required." }),
  }),
  body: planBaseSchema.partial(),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    slug: z.enum(PlanSlug).optional(),
    is_active: z.coerce.boolean().optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Plan ID is required." }),
  }),
});

export const PlanDto = {
  create,
  update,
  list,
  single,
  remove: single,
};
