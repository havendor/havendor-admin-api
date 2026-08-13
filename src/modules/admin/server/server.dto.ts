import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import {
  ColumnGenericStatus,
  ServerEnvironment,
  ServerHealthStatus,
  ServerLocation,
  ServerProvider,
} from "../../../generated/prisma/index.js";

const serverBaseSchema = z.object({
  name: z.string({ error: "Name is required." }).min(1, { message: "Name cannot be empty." }),
  slug: z.string({ error: "Slug is required." }).min(1, { message: "Slug cannot be empty." }),
  hostname: z.string().nullish(),
  public_ip: z
    .string({ error: "Public IP is required." })
    .min(1, { message: "Public IP cannot be empty." }),
  private_ip: z.string().nullish(),
  ipv6: z.string().nullish(),
  ssh_port: z.coerce.number().int().optional().default(22),
  location: z.enum(ServerLocation, { error: "Server location is required." }),
  region_code: z.string().nullish(),
  availability_zone: z.string().nullish(),
  max_shops: z.coerce.number().int().nullish(),
  priority: z.coerce.number().int().optional().default(100),
  weight: z.coerce.number().int().optional().default(100),
  is_accepting_shops: z.boolean().optional().default(true),
  is_default_for_location: z.boolean().optional().default(false),
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
  environment: z.enum(ServerEnvironment).optional().default(ServerEnvironment.PRODUCTION),
  provider: z.enum(ServerProvider).nullish(),
  provider_instance_id: z.string().nullish(),
  cpu_cores: z.coerce.number().int().nullish(),
  memory_mb: z.coerce.number().int().nullish(),
  disk_gb: z.coerce.number().int().nullish(),
  os_image: z.string().nullish(),
  agent_version: z.string().nullish(),
  deploy_base_url: z.string().nullish(),
  labels: z.record(z.string(), z.unknown()).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  notes: z.string().nullish(),
});

const create = z.object({
  body: serverBaseSchema,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Server ID is required." }),
  }),
  body: serverBaseSchema.partial(),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    location: z.enum(ServerLocation).optional(),
    status: z.enum(ColumnGenericStatus).optional(),
    health_status: z.enum(ServerHealthStatus).optional(),
    environment: z.enum(ServerEnvironment).optional(),
    provider: z.enum(ServerProvider).optional(),
    is_accepting_shops: z.coerce.boolean().optional(),
    is_default_for_location: z.coerce.boolean().optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Server ID is required." }),
  }),
});

const toggleDrain = z.object({
  params: z.object({
    id: z.uuid({ error: "Server ID is required." }),
  }),
  body: z.object({
    is_accepting_shops: z.boolean({ error: "is_accepting_shops status is required." }),
  }),
});

const setDefault = z.object({
  params: z.object({
    id: z.uuid({ error: "Server ID is required." }),
  }),
  body: z.object({
    is_default_for_location: z.boolean().optional().default(true),
  }),
});

export const ServerDto = {
  create,
  update,
  list,
  single,
  remove: single,
  toggleDrain,
  setDefault,
};
