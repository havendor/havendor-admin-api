import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { FeatureStatus, FeatureType } from "../../../generated/prisma/index.js";

const body = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, { message: "Key must be snake_case." }),
  name: z.string().min(1),
  description: z.string().nullish(),
  type: z.enum(FeatureType),
  status: z.enum(FeatureStatus).optional().default(FeatureStatus.ACTIVE),
});

export const FeatureDto = {
  create: z.object({ body }),
  update: z.object({
    params: z.object({ id: z.uuid() }),
    body: body
      .partial()
      .omit({ key: true })
      .extend({
        key: z
          .string()
          .min(1)
          .max(100)
          .regex(/^[a-z0-9_]+$/)
          .optional(),
      }),
  }),
  list: z.object({
    query: commonQuerySchema.safeExtend({
      search: z.string().optional(),
      type: z.enum(FeatureType).optional(),
      status: z.enum(FeatureStatus).optional(),
    }),
  }),
  single: z.object({ params: z.object({ id: z.uuid() }) }),
  remove: z.object({ params: z.object({ id: z.uuid() }) }),
};
