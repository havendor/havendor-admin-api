import { ApiError, verifyJwt } from "@havendor/server-core";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { cacheAdmin } from "../cache/admin";
import { appConfig } from "../config";
import { TPermission } from "../const";
import { UserStatus } from "../generated/prisma";
import { TAdminCache } from "../modules/admin/admin/admin.type";
import { TAdminJWTPayload } from "../type";
import { prisma } from "../utility/prisma";

export const adminAuthGuard =
  ({
    allowedPermissions,
    skipPasswordChange = false,
  }: {
    allowedPermissions?: TPermission[];
    skipPasswordChange?: boolean;
  }) =>
  async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];

    const [scheme, token] = authHeader?.split(" ") || [];
    if (scheme?.toLowerCase() !== "bearer" || !token)
      throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid authorization format", null, {});

    const payload = verifyJwt<TAdminJWTPayload>(token, appConfig.JWT.secret);

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
        throw new ApiError(httpStatus.UNAUTHORIZED, "Unauthorized", null, {});
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
        "SIGN_OUT",
      );
    }

    if (user.status === "NEEDS_PASSWORD_CHANGE" && !skipPasswordChange) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account needs a password change",
        null,
        null,
        "UPDATE_PASSWORD",
      );
    }

    if (allowedPermissions?.length) {
      const hasPermission = allowedPermissions.some((permission) =>
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
