import {
  commonQuerySchema,
  fileSchema,
  mobileNumberOptionalSchema,
  mobileNumberSchema,
} from "@havendor/server-core";
import z from "zod";
import {
  BloodGroup,
  EmergencyContactRelation,
  IdentityType,
  UserGender,
  UserStatus,
} from "../../../generated/prisma/index.js";
import { addressSchema } from "../../../validations/index.js";

const admin = z
  .object({
    first_name: z.string({ error: "First name is required" }).min(1, {
      message: "First name can not be empty.",
    }),
    last_name: z.string().nullish(),
    email: z.email({ error: "Email is required" }),
    mobile: mobileNumberSchema,
    alt_mobile: mobileNumberOptionalSchema,
    emergency_contact_name: z.string().nullish(),
    emergency_contact_mobile: mobileNumberOptionalSchema,
    emergency_contact_relation: z.enum(EmergencyContactRelation).nullish(),
    blood_group: z.enum(BloodGroup).nullish(),
    date_of_birth: z.date().nullish(),
    gender: z.enum(UserGender).nullish(),
    identity_no: z.string().nullish(),
    identity_type: z.enum(IdentityType).nullish(),
    profile_image: fileSchema.partial().nullable().optional(),
    identity_document: fileSchema.partial().nullable().optional(),
    bio: z.string().nullish(),
    last_education: z.string().nullish(),
    present_address: addressSchema(),
    permanent_address: addressSchema(),
    role_id: z.uuid({ error: "Role is required" }),
    is_system: z
      .boolean()
      .optional()
      .transform(() => false),
  })
  .superRefine((data, ctx) => {
    if (data.identity_no && !data.identity_type) {
      ctx.addIssue({
        code: "custom",
        message: "Identity type is required",
        path: ["identity_type"],
      });
    }

    if (data.identity_type && !data.identity_no) {
      ctx.addIssue({
        code: "custom",
        message: "Identity number is required",
        path: ["identity_no"],
      });
    }
  });

const create = z.object({
  body: admin.required(),
});

const update = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
  body: admin.required(),
});

const updateStatus = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
  body: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.TERMINATED], {
    error: "Status is required",
  }),
});

const list = z.object({
  query: commonQuerySchema.safeExtend({
    status: z.enum(UserStatus).optional(),
    search: z.string().optional(),
    id: z.uuid().optional(),
    ids: z.array(z.uuid()).optional(),
  }),
});

const remove = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
});

const restore = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
});

const single = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
});

const resetPassword = z.object({
  params: z.object({
    id: z.uuid({ error: "Admin ID is required" }),
  }),
});

export const AdminDto = {
  create,
  update,
  updateStatus,
  list,
  remove,
  restore,
  single,
  resetPassword,
};
