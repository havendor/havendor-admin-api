import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import {
  ColumnGenericStatus,
  DatabaseProvider,
  DatabaseSslMode,
  ServerEnvironment,
  ServerHealthStatus,
  ServerLocation,
} from "../../../generated/prisma/index.js";

const databaseBaseSchema = z.object({
  name: z.string({ error: "Name is required." }).min(1, { message: "Name cannot be empty." }),
  slug: z.string({ error: "Slug is required." }).min(1, { message: "Slug cannot be empty." }),
  hostname: z.string().nullish(),
  provider: z.enum(DatabaseProvider, { error: "Database provider is required." }),
  provider_instance_id: z.string().nullish(),
  environment: z.enum(ServerEnvironment).optional().default(ServerEnvironment.PRODUCTION),
  location: z.enum(ServerLocation).nullish(),
  region_code: z.string().nullish(),
  host: z.string({ error: "Host is required." }).min(1, { message: "Host cannot be empty." }),
  port: z.coerce.number().int().optional().default(5432),
  db_name: z
    .string({ error: "Database name is required." })
    .min(1, { message: "Database name cannot be empty." }),
  username: z
    .string({ error: "Username is required." })
    .min(1, { message: "Username cannot be empty." }),
  password: z
    .string({ error: "Password is required." })
    .min(1, { message: "Password cannot be empty." }),
  ssl_mode: z.enum(DatabaseSslMode).optional().default(DatabaseSslMode.REQUIRE),
  max_schemas: z.coerce.number().int().nullish(),
  priority: z.coerce.number().int().optional().default(100),
  is_accepting_schemas: z.boolean().optional().default(true),
  is_default: z.boolean().optional().default(false),
  status: z
    .enum([
      ColumnGenericStatus.ACTIVE,
      ColumnGenericStatus.INACTIVE,
      ColumnGenericStatus.PENDING,
      ColumnGenericStatus.DELETED,
    ])
    .optional()
    .default(ColumnGenericStatus.PENDING),
  health_status: z.enum(ServerHealthStatus).optional().default(ServerHealthStatus.UNKNOWN),
  labels: z.record(z.string(), z.unknown()).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  notes: z.string().nullish(),
});

const create = z.object({
  body: databaseBaseSchema,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Database ID is required." }),
  }),
  body: databaseBaseSchema.partial().extend({
    password: z.string().optional(),
  }),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    provider: z.enum(DatabaseProvider).optional(),
    status: z.enum(ColumnGenericStatus).optional(),
    health_status: z.enum(ServerHealthStatus).optional(),
    environment: z.enum(ServerEnvironment).optional(),
    location: z.enum(ServerLocation).optional(),
    is_accepting_schemas: z.coerce.boolean().optional(),
    is_default: z.coerce.boolean().optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Database ID is required." }),
  }),
});

const toggleDrain = z.object({
  params: z.object({
    id: z.uuid({ error: "Database ID is required." }),
  }),
  body: z.object({
    is_accepting_schemas: z.boolean({ error: "is_accepting_schemas status is required." }),
  }),
});

const setDefault = z.object({
  params: z.object({
    id: z.uuid({ error: "Database ID is required." }),
  }),
  body: z.object({
    is_default: z.boolean().optional().default(true),
  }),
});

export const DatabaseDto = {
  create,
  update,
  list,
  single,
  remove: single,
  toggleDrain,
  setDefault,
};
