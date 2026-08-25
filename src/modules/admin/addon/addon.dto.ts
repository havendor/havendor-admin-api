import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";

const featureLink = z.object({
  feature_id: z.uuid(),
  enabled: z.boolean().optional().default(true),
  limit_value: z.coerce.number().nullish(),
});

const body = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, { message: "Slug must be kebab-case." }),
  name: z.string().min(1),
  description: z.string().nullish(),
  is_active: z.boolean().optional().default(true),
  price_monthly: z.coerce.number().int().min(0),
  price_yearly: z.coerce.number().int().min(0),
  features: z.array(featureLink).optional(),
});

export const AddonDto = {
  create: z.object({ body }),
  update: z.object({ params: z.object({ id: z.uuid() }), body: body.partial() }),
  list: z.object({
    query: commonQuerySchema.safeExtend({
      search: z.string().optional(),
      is_active: z.coerce.boolean().optional(),
    }),
  }),
  single: z.object({ params: z.object({ id: z.uuid() }) }),
  remove: z.object({ params: z.object({ id: z.uuid() }) }),
};
