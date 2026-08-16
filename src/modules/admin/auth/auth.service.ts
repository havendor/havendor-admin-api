import { ApiError, buildImageUrl, hash } from "@havendor/server-core";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import { cacheAdmin } from "../../../cache/index.js";
import { APP_CONFIG } from "../../../config/index.js";
import { ACTION } from "../../../const/index.js";
import { UserStatus } from "../../../generated/prisma/index.js";
import { prisma } from "../../../utility/index.js";
import { TAdminCache } from "../admin/admin.type.js";
import { TChangePassword, TRefresh, TSignIn } from "./auth.type.js";

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
      APP_CONFIG.JWT.secret,
      {
        expiresIn: APP_CONFIG.JWT.access_expires,
      },
    );

    const refreshToken = crypto.randomBytes(64).toString("hex");

    const tokenHash = hash({ token: refreshToken });

    const refreshTokenExpiresIn = payload.remember_me
      ? APP_CONFIG.REMEMBER_ME_EXPIRES
      : APP_CONFIG.REFRESH_EXPIRES;

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
  const FAILED_TO_REFRESH = "Failed to refresh token";

  const token = payload[APP_CONFIG.ADMIN_REFRESH_TOKEN_NAME];

  const hashToken = hash({ token });

  const session = await prisma.adminSession.findFirst({
    where: { refresh_token_hash: hashToken },
    include: { admin: true },
  });

  if (!session)
    throw new ApiError(
      httpStatus.NOT_FOUND,
      FAILED_TO_REFRESH,
      "Session not found",
      null,
      ACTION.SIGN_IN,
    );

  if (session.expires_in < new Date())
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      FAILED_TO_REFRESH,
      "Session expired",
      null,
      ACTION.SIGN_IN,
    );

  if (["INACTIVE", "DELETED", "TERMINATED"].includes(session.admin.status))
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      FAILED_TO_REFRESH,
      "Session expired",
      null,
      ACTION.SIGN_IN,
    );

  // Generate outside transaction — keep session_id so guards can revoke the active session
  const accessToken = jwt.sign(
    {
      id: session.admin.id,
      role_id: session.admin.role_id,
      session_id: session.id,
    },
    APP_CONFIG.JWT.secret,
    {
      expiresIn: APP_CONFIG.JWT.access_expires,
    },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");

  const refreshTokenHash = hash({ token: refreshToken });

  // Only DB update inside transaction
  await prisma.adminSession.update({
    where: { id: session.id },
    data: {
      refresh_token_hash: refreshTokenHash,
      last_used_at: new Date(),
    },
  });

  return {
    accessToken,
    refreshToken,
    refreshTokenExpiresIn: session.expires_in.getTime() - Date.now(),
  };
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
            omit: { role_id: true, permission_id: true },
          },
        },
        omit: {
          description: true,
          status: true,
          is_system: true,
          created_at: true,
          updated_at: true,
        },
      },
    },
    omit: {
      password: true,
      identity_document_bucket: true,
      identity_document: true,
      profile_image_bucket: true,
      present_address_id: true,
      permanent_address_id: true,
      role_id: true,
      updated_at: true,
      deleted_at: true,
      created_at: true,
      deleted_by_id: true,
      delete_reason: true,
      terminated_at: true,
      terminated_by_id: true,
      termination_reason: true,
      created_by_id: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "No admin found with this id", null, {});

  const profileImage = buildImageUrl(user.profile_image);

  user = {
    ...user,
    profile_image: profileImage,
  };

  return user;
};

const signOut = async (payload: TAdminCache) => {
  return prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.adminSession.delete({
        where: {
          id: payload.session_id,
          admin_id: payload.id,
        },
      }),
      cacheAdmin.deleteAdmin(payload.id),
    ]);
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
        ACTION.SIGN_OUT,
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

const allSessions = async (user: TAdminCache) => {
  const data = await prisma.adminSession.findMany({
    where: { admin_id: user.id },
    omit: { refresh_token_hash: true, admin_id: true },
    orderBy: {
      created_at: "asc",
    },
  });
  return data;
};

const deleteSession = async (sessionId: string, user: TAdminCache) => {
  await prisma.adminSession.delete({ where: { admin_id: user.id, id: sessionId } });
};

export const AuthService = {
  signIn,
  refresh,
  me,
  signOut,
  changePassword,
  allSessions,
  deleteSession,
};
