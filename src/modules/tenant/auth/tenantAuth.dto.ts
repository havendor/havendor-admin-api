import { passwordSchema } from "@havendor/server-core";
import z from "zod";

import appConfig from "../../../config/appConfig.js";
import { tenantSchema } from "../../admin/tenant/tenant.dto.js";

const signUp = z.object({
  body: tenantSchema,
});

const signIn = z.object({
  email: z.email({ error: "Email is required" }),
  password: z.string({ error: "Password is required" }),
  remember_me: z.boolean().optional().default(false),
});

const changePassword = z
  .object({
    old_password: z.string(),
    new_password: passwordSchema,
    confirm_password: passwordSchema,
    sign_out_all_sessions: z.boolean().optional().default(false),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    path: ["confirm_password"],
    message: "Passwords do not match",
  });

const refresh = z.object({
  [appConfig.TENANT_REFRESH_TOKEN_NAME]: z.string({ error: "Refresh token is required" }),
});

export const TenantAuthDto = {
  signUp,
  signIn: z.object({
    body: signIn,
  }),
  changePassword: z.object({
    body: changePassword,
  }),
  refresh: z.object({
    cookies: refresh,
  }),
  deleteSession: z.object({
    params: z.object({
      id: z.string(),
    }),
  }),
};
