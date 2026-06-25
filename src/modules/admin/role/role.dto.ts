import { commonQuerySchema } from "@havendor/server-core";
import z from "zod";
import { ColumnGenericStatus } from "../../../generated/prisma/index.js";

const role = z.object({
  name: z.string({ error: "Role name is required" }).min(1, {
    message: "Role name can not be empty.",
  }),
  description: z.string({ error: "Role description is required" }).nullish().default(null),
  status: z
    .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE, ColumnGenericStatus.PENDING], {
      error: "Role status is required",
    })
    .default(ColumnGenericStatus.ACTIVE),
  is_system: z
    .boolean()
    .transform(() => false)
    .default(false),
  permissions: z.array(z.string({ error: "Permission is required" })).min(1, {
    message: "At least one permission is required.",
  }),
});

const create = z.object({
  body: role,
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Role ID is required" }),
  }),
  body: role.required(),
});

const remove = z.object({
  params: z.object({
    id: z.uuid({ error: "Role ID is required" }),
  }),
});

const restore = z.object({
  params: z.object({
    id: z.uuid({ error: "Role ID is required" }),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Role ID is required" }),
  }),
});

const list = z.object({
  query: z.intersection(
    commonQuerySchema,
    z.object({
      status: z.enum(ColumnGenericStatus).optional(),
    }),
  ),
});

export const RoleDto = {
  create,
  update,
  remove,
  restore,
  single,
  list,
};
