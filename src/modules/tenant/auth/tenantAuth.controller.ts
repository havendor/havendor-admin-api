import { response, setCookie } from "@havendor/server-core";
import httpStatus from "http-status";
import { APP_CONFIG } from "../../../config/index.js";
import { catchAsync } from "../../../middleware/index.js";
import { TTenantPayload } from "../../admin/tenant/tenant.type.js";
import { TenantAuthService } from "./tenantAuth.service.js";
import { TTenantSignIn } from "./tenantAuth.type.js";

const signUp = catchAsync(async (req, res) => {
  const user = await TenantAuthService.signUp(req.validated?.body as TTenantPayload);

  return response(res, {
    status_code: httpStatus.CREATED,
    success: true,
    message: "Signed up successfully",
    data: user,
  });
});

const signIn = catchAsync(async (req, res) => {
  const body = req.body as TTenantSignIn;
  const { accessToken, refreshToken, refreshTokenExpiresIn } = await TenantAuthService.signIn(
    body,
    req,
  );

  setCookie(res, {
    name: APP_CONFIG.TENANT_REFRESH_TOKEN_NAME,
    value: refreshToken,
    options: {
      httpOnly: true,
      path: "/",
      maxAge: refreshTokenExpiresIn,
    },
  });

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Sign in successfully",
    data: {
      access_token: accessToken,
    },
  });
});

const refresh = catchAsync(async (req, res) => {
  const { accessToken, refreshToken, refreshTokenExpiresIn } = await TenantAuthService.refresh(
    req.cookies,
  );

  setCookie(res, {
    name: APP_CONFIG.TENANT_REFRESH_TOKEN_NAME,
    value: refreshToken,
    options: {
      httpOnly: true,
      path: "/",
      maxAge: refreshTokenExpiresIn,
    },
  });

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Refresh token successfully",
    data: {
      access_token: accessToken,
    },
  });
});

const me = catchAsync(async (req, res) => {
  const user = await TenantAuthService.me(req.tenant!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

const signOut = catchAsync(async (req, res) => {
  await TenantAuthService.signOut(req.tenant!);

  res.clearCookie(APP_CONFIG.TENANT_REFRESH_TOKEN_NAME);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Sign out successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  await TenantAuthService.changePassword(req.validated!.body, req.tenant!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
  });
});

const allSessions = catchAsync(async (req, res) => {
  const data = await TenantAuthService.allSessions(req.tenant!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "All sessions fetched successfully",
    data,
  });
});

const deleteSession = catchAsync(async (req, res) => {
  const data = await TenantAuthService.deleteSession(req.validated!.params!.id, req.tenant!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Session deleted successfully",
    data,
  });
});

export const TenantAuthController = {
  signUp,
  signIn,
  refresh,
  me,
  signOut,
  changePassword,
  allSessions,
  deleteSession,
};
