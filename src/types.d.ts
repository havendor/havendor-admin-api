/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/consistent-type-definitions */
import "express-serve-static-core";
import { TAdminCache } from "./modules/admin/admin/admin.type";
import { MulterS3File } from "./type/Multers3File";

declare module "express-serve-static-core" {
  interface Request {
    userIp?: string;
    userAgent?: string;
    tenantId?: string;
    admin?: TAdminCache;
    files?: MulterS3File[];
    file?: MulterS3File;
    validated?: {
      body?: any;
      query?: any;
      params?: any;
      cookies?: any;
    };
  }
}
