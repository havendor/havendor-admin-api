import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { DomainSSLStatus, DomainStatus, ShopDomainType } from "../../../generated/prisma/index.js";

const shopDomainBaseSchema = z.object({
  shop_id: z.uuid({ error: "Shop ID is required." }),
  domain: z
    .string({ error: "Domain is required." })
    .min(1, { message: "Domain cannot be empty." })
    .toLowerCase()
    .trim(),
  type: z.enum(ShopDomainType, { error: "Domain type is required." }),
  is_primary: z.boolean().optional().default(false),
  dns_target: z.string().nullish(),
  status: z.enum(DomainStatus).optional().default(DomainStatus.PENDING),
});

const create = z.object({
  body: shopDomainBaseSchema,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Domain ID is required." }),
  }),
  body: z.object({
    domain: z.string().toLowerCase().trim().optional(),
    type: z.enum(ShopDomainType).optional(),
    status: z.enum(DomainStatus).optional(),
    dns_target: z.string().nullish(),
    error_message: z.string().nullish(),
    ssl_status: z.enum(DomainSSLStatus).optional(),
    ssl_enabled: z.boolean().optional(),
    ssl_expires_at: z.coerce.date().nullish(),
  }),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    search: z.string().optional(),
    shop_id: z.uuid().optional(),
    type: z.enum(ShopDomainType).optional(),
    status: z.enum(DomainStatus).optional(),
    ssl_status: z.enum(DomainSSLStatus).optional(),
    is_primary: z.coerce.boolean().optional(),
    dns_verified: z.coerce.boolean().optional(),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Domain ID is required." }),
  }),
});

const setPrimary = z.object({
  params: z.object({
    id: z.uuid({ error: "Domain ID is required." }),
  }),
});

const manageSsl = z.object({
  params: z.object({
    id: z.uuid({ error: "Domain ID is required." }),
  }),
  body: z.object({
    ssl_status: z.enum(DomainSSLStatus, { error: "SSL status is required." }),
    ssl_enabled: z.boolean().optional().default(true),
    ssl_expires_at: z.coerce.date().nullish(),
  }),
});

export const ShopDomainDto = {
  create,
  update,
  list,
  single,
  remove: single,
  verify: single,
  setPrimary,
  manageSsl,
};
