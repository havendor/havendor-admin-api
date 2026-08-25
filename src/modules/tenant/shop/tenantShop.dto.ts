import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { ColumnGenericStatus } from "../../../generated/prisma/index.js";

const create = z.object({
  body: z.object({
    shop_name: z
      .string({ error: "Shop name is required." })
      .min(1, { message: "Shop name cannot be empty." }),
    description: z
      .string({ error: "Description is required." })
      .min(1, { message: "Description cannot be empty." }),
  }),
});

const update = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid Shop ID." }),
  }),
  body: z.object({
    shop_name: z.string().optional(),
    description: z.string().optional(),
    status: z.enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE]).optional(),
  }),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    status: z
      .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE, ColumnGenericStatus.PENDING])
      .optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ message: "Invalid Shop ID." }),
  }),
});

export const TenantShopDto = {
  create,
  update,
  list,
  single,
  remove: single,
};
