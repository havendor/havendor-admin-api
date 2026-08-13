import { ApiError, buildImageUrl, hash } from "@havendor/server-core";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { Request } from "express";
import httpStatus from "http-status";
import jwt from "jsonwebtoken";
import { UAParser } from "ua-parser-js";
import appConfig from "../../../config/appConfig.js";
import { ACTION } from "../../../const/actions.js";
import { UserStatus } from "../../../generated/prisma/index.js";
import { prisma } from "../../../utility/prisma.js";
import { TTenantPayload } from "../../admin/tenant/tenant.type.js";
import {
  TTenantCache,
  TTenantChangePassword,
  TTenantRefresh,
  TTenantSignIn,
} from "./tenantAuth.type.js";

const FAILED_TO_SIGN_IN = "Failed to sign in";
const MAX_SESSIONS = 3;

const signUp = async (payload: TTenantPayload) => {
  const isEmailExists = await prisma.tenant.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (isEmailExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Failed to signup", null, {
      email: ["Email already exists"],
    });
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const user = await prisma.tenant.create({
    data: {
      ...payload,
      password: hashedPassword,
      profile_image: payload.profile_image?.key,
      profile_image_bucket: payload.profile_image?.bucket,
      present_address: {
        create: {
          ...payload.present_address,
        },
      },
      permanent_address: {
        create: {
          ...payload.permanent_address,
        },
      },
    },
  });

  return user;
};

const signIn = async (payload: TTenantSignIn, request: Request) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.tenant.findUnique({
      where: { email: payload.email },
      select: { id: true, status: true, password: true },
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

    const accessToken = jwt.sign({ id: user.id, session_id }, appConfig.JWT.secret, {
      expiresIn: appConfig.JWT.access_expires,
    });

    const refreshToken = crypto.randomBytes(64).toString("hex");
    const tokenHash = hash({ token: refreshToken });

    const refreshTokenExpiresIn = payload.remember_me
      ? appConfig.REMEMBER_ME_EXPIRES
      : appConfig.REFRESH_EXPIRES;

    const newSession = await tx.tenantSession.create({
      data: {
        id: session_id,
        tenant_id: user.id,
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

    const oldSessions = await tx.tenantSession.findMany({
      where: {
        tenant_id: user.id,
      },
      orderBy: { created_at: "asc" },
      select: { id: true },
    });
    if (oldSessions.length > MAX_SESSIONS) {
      const sessionsToDelete = oldSessions.slice(0, oldSessions.length - MAX_SESSIONS);

      await tx.tenantSession.deleteMany({
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

const refresh = async (payload: TTenantRefresh) => {
  const FAILED_TO_REFRESH = "Failed to refresh token";
  const token = payload[appConfig.TENANT_REFRESH_TOKEN_NAME];
  const hashToken = hash({ token });

  const session = await prisma.tenantSession.findFirst({
    where: { refresh_token_hash: hashToken },
    include: { tenant: true },
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

  if (["INACTIVE", "DELETED", "TERMINATED"].includes(session.tenant.status))
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      FAILED_TO_REFRESH,
      "Session expired",
      null,
      ACTION.SIGN_IN,
    );

  // Keep session_id so sign-out / session APIs work after refresh
  const accessToken = jwt.sign(
    {
      id: session.tenant.id,
      session_id: session.id,
    },
    appConfig.JWT.secret,
    {
      expiresIn: appConfig.JWT.access_expires,
    },
  );

  const refreshToken = crypto.randomBytes(64).toString("hex");
  const refreshTokenHash = hash({ token: refreshToken });

  await prisma.tenantSession.update({
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
  let user = await prisma.tenant.findUnique({
    where: { id },
    omit: {
      password: true,
      profile_image_bucket: true,
      present_address_id: true,
      permanent_address_id: true,
      updated_at: true,
      deleted_at: true,
      created_at: true,
      deleted_by_id: true,
      delete_reason: true,
      terminated_at: true,
      terminated_by_id: true,
      termination_reason: true,
    },
  });

  if (!user) throw new ApiError(httpStatus.NOT_FOUND, "No tenant found with this id", null, {});

  const profileImage = buildImageUrl(user.profile_image);

  user = {
    ...user,
    profile_image: profileImage,
  };

  return user;
};

const signOut = async (payload: TTenantCache) => {
  return prisma.$transaction(async (tx) => {
    await tx.tenantSession.delete({
      where: {
        id: payload.session_id,
        tenant_id: payload.id,
      },
    });
  });
};

const changePassword = async (payload: TTenantChangePassword, user: TTenantCache) => {
  return prisma.$transaction(async (tx) => {
    if (payload.sign_out_all_sessions) {
      await tx.tenantSession.deleteMany({
        where: { tenant_id: user.id, id: { not: user.session_id } },
      });
    }

    const tenant = await tx.tenant.findUnique({
      where: { id: user.id },
      select: { id: true, status: true, password: true },
    });

    if (!tenant) throw new ApiError(httpStatus.NOT_FOUND, "No tenant found with this id", null, {});

    if ((["INACTIVE", "DELETED", "TERMINATED"] as UserStatus[]).includes(tenant.status)) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account has been deactivated",
        null,
        null,
        ACTION.SIGN_OUT,
      );
    }

    const isPasswordMatch = await bcrypt.compare(payload.old_password, tenant.password);

    if (!isPasswordMatch)
      throw new ApiError(httpStatus.NOT_FOUND, "Invalid old password", null, {});

    const hashedPassword = await bcrypt.hash(payload.new_password, 12);

    const updatedUser = await tx.tenant.update({
      where: { id: user.id },
      data: { password: hashedPassword, status: "ACTIVE" },
      select: { id: true, status: true },
    });

    return updatedUser;
  });
};

const allSessions = async (user: TTenantCache) => {
  const data = await prisma.tenantSession.findMany({
    where: { tenant_id: user.id },
    omit: { refresh_token_hash: true, tenant_id: true },
    orderBy: {
      created_at: "asc",
    },
  });
  return data;
};

const deleteSession = async (sessionId: string, user: TTenantCache) => {
  await prisma.tenantSession.delete({ where: { tenant_id: user.id, id: sessionId } });
};

export const TenantAuthService = {
  signUp,
  signIn,
  refresh,
  me,
  signOut,
  changePassword,
  allSessions,
  deleteSession,
};
