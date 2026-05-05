import { ApiError, buildImageUrl, hash } from "@havendor/server-core";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { cacheAdmin } from "../../../cache/admin";
import { appConfig } from "../../../config";
import { UserStatus } from "../../../generated/prisma";
import { prisma } from "../../../utility/prisma";
import { TAdminCache } from "../admin/admin.type";
import { TChangePassword, TRefresh, TSignIn } from "./auth.type";

const FAILED_TO_SIGN_IN = "Failed to sign in";
const MAX_SESSIONS = 3;

const signIn = async (payload: TSignIn, request: Request) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.admin.findUnique({
      where: { email: payload.email },
      select: { id: true, status: true, password: true, role_id: true },
    });

    if (!user)
      throw new ApiError(httpStatus.NOT_FOUND, FAILED_TO_SIGN_IN, null, {
        email: ["No user found with this email"],
      });

    if (user.status === "DELETED")
      throw new ApiError(httpStatus.NOT_FOUND, FAILED_TO_SIGN_IN, null, {
        email: ["Your account has been deleted. Please contact the administrator."],
      });

    if (user.status === "TERMINATED")
      throw new ApiError(httpStatus.NOT_FOUND, FAILED_TO_SIGN_IN, null, {
        email: ["Your account has been terminated. Please contact the administrator."],
      });

    if (user.status === "INACTIVE")
      throw new ApiError(httpStatus.NOT_FOUND, FAILED_TO_SIGN_IN, null, {
        email: ["Your account is inactive. Please contact the administrator."],
      });

    const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

    const parser = new UAParser(request.userAgent);
    const result = parser.getResult();

    if (!isPasswordMatch)
      throw new ApiError(httpStatus.UNAUTHORIZED, FAILED_TO_SIGN_IN, null, {
        password: ["Invalid password"],
      });

    const session_id = crypto.randomUUID();

    const accessToken = jwt.sign(
      { id: user.id, role_id: user.role_id, session_id },
      appConfig.JWT.secret,
      {
        expiresIn: appConfig.JWT.access_expires,
      },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const tokenHash = hash({ token: refreshToken });

    const refreshTokenExpiresIn = payload.remember_me
      ? appConfig.REMEMBER_ME_EXPIRES
      : appConfig.REFRESH_EXPIRES;

    const newSession = await tx.adminSession.create({
      data: {
        id: session_id,
        admin_id: user.id,
        ip: request.userIp,
        browser:
          result.browser.name || result.browser.version
            ? `${result.browser.name ?? ""} ${result.browser.version ?? ""}`
            : null,
        os:
          result.os.name || result.os.version
            ? `${result.os.name ?? ""} ${result.os.version ?? ""}`
            : null,
        browser_version: result.browser.version ?? null,
        os_version: result.os.version ?? null,
        refresh_token_hash: tokenHash,
        expires_in: new Date(Date.now() + refreshTokenExpiresIn * 1000),
        last_used_at: new Date(Date.now()),
      },
    });

    const oldSessions = await tx.adminSession.findMany({
      where: {
        admin_id: user.id,
      },
      orderBy: { created_at: "asc" },
      select: { id: true },
    });
    if (oldSessions.length > MAX_SESSIONS) {
      const sessionsToDelete = oldSessions.slice(0, oldSessions.length - MAX_SESSIONS);

      await tx.adminSession.deleteMany({
        where: {
          id: { in: sessionsToDelete.map((s) => s.id) },
        },
      });
    }
    return {
      accessToken,
      refreshToken,
      refreshTokenExpiresIn: newSession.expires_in.getTime() - Date.now(),
    };
  });
};

const refresh = async (payload: TRefresh) => {
  return prisma.$transaction(async (tx) => {
    const token = payload[appConfig.ADMIN_REFRESH_TOKEN_NAME];

    const hashToken = hash({ token });

    const session = await tx.adminSession.findFirst({
      where: { refresh_token_hash: hashToken },
      include: { admin: true },
    });

    if (!session) throw new ApiError(httpStatus.NOT_FOUND, "Session not found", null, {});

    if (session.expires_in < new Date(Date.now()))
      throw new ApiError(httpStatus.UNAUTHORIZED, "Session expired", null, {});

    if (["INACTIVE", "DELETED", "TERMINATED"].includes(session.admin.status))
      throw new ApiError(httpStatus.UNAUTHORIZED, "Session expired", null, {});

    const newToken = jwt.sign(
      { id: session.admin.id, role_id: session.admin.role_id },
      appConfig.JWT.secret,
      {
        expiresIn: appConfig.JWT.access_expires,
      },
    );

    const newRefreshToken = crypto.randomBytes(64).toString("hex");

    const newRefreshTokenHash = hash({ token: newRefreshToken });

    const updatedSession = await tx.adminSession.update({
      where: { id: session.id },
      data: {
        refresh_token_hash: newRefreshTokenHash,
        last_used_at: new Date(Date.now()),
      },
    });

    return {
      accessToken: newToken,
      refreshToken: newRefreshToken,
      refreshTokenExpiresIn: updatedSession.expires_in.getTime() - Date.now(),
    };
  });
};

const me = async (id: string) => {
  let user = await prisma.admin.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    omit: { password: true },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "No admin found with this id", null, {});

  const profileImage =
    user?.profile_image && user.profile_image.trim() !== ""
      ? buildImageUrl(user.profile_image)
      : null;

  const identityDocument =
    user?.identity_document && user.identity_document.trim() !== ""
      ? buildImageUrl(user.identity_document)
      : null;

  user = {
    ...user,
    profile_image: profileImage,
    identity_document: identityDocument,
  };

  return user;
};

const signOut = async (payload: TAdminCache) => {
  return prisma.$transaction(async (tx) => {
    await tx.adminSession.delete({
      where: {
        id: payload.session_id,
        admin_id: payload.id,
      },
    });

    await cacheAdmin.deleteAdmin(payload.id);
  });
};

const changePassword = async (payload: TChangePassword, user: TAdminCache) => {
  return prisma.$transaction(async (tx) => {
    if (payload.sign_out_all_sessions) {
      await tx.adminSession.deleteMany({
        where: { admin_id: user.id, id: { not: user.session_id } },
      });
    }

    const admin = await tx.admin.findUnique({
      where: { id: user.id },
      select: { id: true, status: true, password: true },
    });

    if (!admin) throw new ApiError(httpStatus.NOT_FOUND, "No admin found with this id", null, {});

    if ((["INACTIVE", "DELETED", "TERMINATED"] as UserStatus[]).includes(admin.status)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account has been deactivated",
        null,
        null,
        "SIGN_OUT",
      );
    }

    const isPasswordMatch = await bcrypt.compare(payload.old_password, admin.password);

    if (!isPasswordMatch)
      throw new ApiError(httpStatus.NOT_FOUND, "Invalid old password", null, {});

    const hashedPassword = await bcrypt.hash(payload.new_password, 12);

    const updatedUser = await tx.admin.update({
      where: { id: user.id },
      data: { password: hashedPassword, status: "ACTIVE" },
      select: { id: true, status: true },
    });

    await cacheAdmin.deleteAdmin(user.id);

    return updatedUser;
  });
};

export const AuthService = {
  signIn,
  refresh,
  me,
  signOut,
  changePassword,
};
