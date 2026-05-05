/* eslint-disable @typescript-eslint/consistent-type-definitions */
import "express-serve-static-core";
import { TAdminCache } from "./modules/admin/admin/admin.type";

declare module "express-serve-static-core" {
  interface Request {
    userIp?: string;
    userAgent?: string;
    tenantId?: string;
    admin?: TAdminCache;
  }
}
