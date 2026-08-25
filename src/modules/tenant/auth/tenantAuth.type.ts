import z from "zod";
import { TenantAuthDto } from "./tenantAuth.dto.js";

export type TTenantSignIn = z.infer<typeof TenantAuthDto.signIn>["body"];
export type TTenantSignUp = z.infer<typeof TenantAuthDto.signUp>["body"];
export type TTenantChangePassword = z.infer<typeof TenantAuthDto.changePassword>["body"];
export type TTenantRefresh = z.infer<typeof TenantAuthDto.refresh>["cookies"];

export type TTenantCache = {
  id: string;
  status: string;
  session_id: string;
};
