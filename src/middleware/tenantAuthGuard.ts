import { ApiError, verifyJwt } from "@havendor/server-core";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { appConfig } from "../config/index.js";
import { ACTION } from "../const/index.js";
import { UserStatus } from "../generated/prisma/index.js";
import { TAdminJWTPayload } from "../type/index.js";
import { prisma } from "../utility/index.js";

export const tenantAuthGuard =
  ({ skip_password_change = false }: { skip_password_change?: boolean } = {}) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];

    const [scheme, token] = authHeader?.split(" ") || [];
    if (scheme?.toLowerCase() !== "bearer" || !token)
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid authorization format",
        null,
        null,
        ACTION.REFRESH_TOKEN,
      );

    const payload = verifyJwt<TAdminJWTPayload>(token, appConfig.JWT.secret, ACTION.REFRESH_TOKEN);

    let liveUser;
    try {
      liveUser = await prisma.tenant.findUniqueOrThrow({
        where: { id: payload.id },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized", null, null, ACTION.REFRESH_TOKEN);
    }

    const user = {
      id: liveUser.id,
      status: liveUser.status,
      session_id: payload.session_id,
    };

    if ((["INACTIVE", "DELETED", "TERMINATED"] as UserStatus[]).includes(user.status)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account has been deactivated",
        null,
        null,
        ACTION.SIGN_OUT,
      );
    }

    if (!skip_password_change && user.status === UserStatus.NEEDS_PASSWORD_CHANGE) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Password change is required",
        null,
        null,
        ACTION.UPDATE_PASSWORD,
      );
    }

    req.tenant = user;

    next();
  };
