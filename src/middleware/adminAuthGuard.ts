import { ApiError, verifyJwt } from "@havendor/server-core";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { cacheAdmin } from "../cache/index.js";
import { appConfig } from "../config/index.js";
import { ACTION, TPermission } from "../const/index.js";
import { UserStatus } from "../generated/prisma/index.js";
import { TAdminCache } from "../modules/admin/admin/admin.type.js";
import { TAdminJWTPayload } from "../type/index.js";
import { prisma } from "../utility/index.js";

export const adminAuthGuard =
  ({
    has_access_to,
    skip_password_change = false,
  }: {
    has_access_to?: TPermission[];
    skip_password_change?: boolean;
  }) =>
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

    let user: TAdminCache | null = await cacheAdmin.getAdmin(payload.id);

    if (!user) {
      let liveUser;

      try {
        liveUser = await prisma.admin.findUniqueOrThrow({
          where: { id: payload.id },
          include: {
            role: {
              select: {
                id: true,
                name: true,
                status: true,
                permissions: { include: { permission: { select: { id: true } } } },
              },
            },
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        throw new ApiError(
          httpStatus.UNAUTHORIZED,
          "Unauthorized",
          null,
          null,
          ACTION.REFRESH_TOKEN,
        );
      }

      user = {
        id: liveUser.id,
        status: liveUser.status,
        role: {
          id: liveUser.role.id,
          name: liveUser.role.name,
          status: liveUser.role.status,
          permissions: liveUser.role.permissions.map(
            (permission) => permission.permission.id,
          ) as TPermission[],
        },
        session_id: payload.session_id,
      };

      await cacheAdmin.setAdmin(payload.id, user);
    }
    if ((["INACTIVE", "DELETED", "TERMINATED"] as UserStatus[]).includes(user.status)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account has been deactivated",
        null,
        null,
        ACTION.SIGN_OUT,
      );
    }

    if (user.status === "NEEDS_PASSWORD_CHANGE" && !skip_password_change) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account needs a password change",
        null,
        null,
        ACTION.UPDATE_PASSWORD,
      );
    }

    if (has_access_to?.length) {
      const hasPermission = has_access_to.some((permission) =>
        user?.role?.permissions?.includes(permission),
      );

      if (!hasPermission) {
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "You do not have permission to access this resource",
          null,
          null,
        );
      }
    }

    req.admin = user;

    next();
  };
