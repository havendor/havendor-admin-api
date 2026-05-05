import { response, setCookie } from "@havendor/server-core";
import httpStatus from "http-status";
import { appConfig } from "../../../config";
import { catchAsync } from "../../../middleware";
import { AuthService } from "./auth.service";
import { TSignIn } from "./auth.type";

const signIn = catchAsync(async (req, res) => {
  const body = req.body as TSignIn;
  const { accessToken, refreshToken, refreshTokenExpiresIn } = await AuthService.signIn(body, req);

  setCookie(res, {
    name: appConfig.ADMIN_REFRESH_TOKEN_NAME,
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
  const { accessToken, refreshToken, refreshTokenExpiresIn } = await AuthService.refresh(
    req.cookies,
  );

  setCookie(res, {
    name: appConfig.ADMIN_REFRESH_TOKEN_NAME,
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
  const user = await AuthService.me(req.admin!.id);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Profile fetched successfully",
    data: user,
  });
});

const signOut = catchAsync(async (req, res) => {
  await AuthService.signOut(req.admin!);

  res.clearCookie(appConfig.ADMIN_REFRESH_TOKEN_NAME);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Sign out successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  await AuthService.changePassword(req.body, req.admin!);

  return response(res, {
    status_code: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
  });
});

export const AuthController = {
  signIn,
  refresh,
  me,
  signOut,
  changePassword,
};
