import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { ColumnGenericStatus } from "../../../generated/prisma/index.js";

const shopBaseSchema = z.object({
  tenant_id: z.uuid({ error: "Tenant ID is required." }),
  shop_name: z
    .string({ error: "Shop name is required." })
    .min(1, { message: "Shop name cannot be empty." }),
  description: z
    .string({ error: "Description is required." })
    .min(1, { message: "Description cannot be empty." }),
  server_id: z.uuid({ error: "Server ID is required." }),
  database_id: z.uuid({ error: "Database ID is required." }),
  identity: z.string().optional(),
  db_schema_name: z.string().optional(),
  status: z
    .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.PENDING, ColumnGenericStatus.INACTIVE])
    .optional()
    .default(ColumnGenericStatus.PENDING),
});

const create = z.object({
  body: shopBaseSchema,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Shop ID is required." }),
  }),
  body: z.object({
    shop_name: z.string().optional(),
    description: z.string().optional(),
    status: z
      .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE, ColumnGenericStatus.PENDING])
      .optional(),
  }),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    tenant_id: z.uuid().optional(),
    server_id: z.uuid().optional(),
    database_id: z.uuid().optional(),
    status: z
      .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE, ColumnGenericStatus.PENDING])
      .optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Shop ID is required." }),
  }),
});

const bulkMigrateDb = z.object({
  body: z
    .object({
      shop_ids: z.array(z.uuid({ error: "Invalid shop ID" })).optional(),
    })
    .optional(),
});

export const ShopDto = {
  create,
  update,
  list,
  single,
  remove: single,
  approve: single,
  suspend: single,
  restore: single,
  migrateDb: single,
  bulkMigrateDb,
};
