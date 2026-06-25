import {
  commonQuerySchema,
  fileSchema,
  mobileNumberOptionalSchema,
  mobileNumberSchema,
  passwordSchema,
} from "@havendor/server-core";
import z from "zod";
import { UserStatus } from "../../../generated/prisma/index.js";
import { addressSchema } from "../../../validations/index.js";

export const tenantSchema = z.object({
  first_name: z.string({ error: "First name is required" }).min(1, {
    message: "First name can not be empty.",
  }),
  last_name: z.string().nullish(),
  email: z.email({ error: "Email is required" }),
  mobile: mobileNumberSchema,
  alt_mobile: mobileNumberOptionalSchema,
  password: passwordSchema,
  status: z.enum([
    UserStatus.ACTIVE,
    UserStatus.INACTIVE,
    UserStatus.TERMINATED,
    UserStatus.NEEDS_PASSWORD_CHANGE,
  ]),
  profile_image: fileSchema.partial().nullable().optional(),
  bio: z.string().nullish(),
  present_address: addressSchema(),
  permanent_address: addressSchema(),
});

const create = z.object({
  body: tenantSchema.omit({ password: true, status: true }),
});

// Update Tenant schema
const update = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: tenantSchema.partial(),
});

// List Tenants (query parameters) with pagination, search and status filter
const list = z.object({
  query: commonQuerySchema.safeExtend({
    status: z.enum(UserStatus).optional(),
    search: z.string().optional(),
    ids: z.array(z.uuid()).optional(),
  }),
});

// Get single tenant
const single = z.object({
  params: z.object({ id: z.string().uuid() }),
});

// Remove (soft delete) tenant
const remove = z.object({
  params: z.object({ id: z.string().uuid() }),
});

export const TenantDto = { create, update, list, single, remove };
