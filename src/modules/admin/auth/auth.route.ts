import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard";
import { AuthController } from "./auth.controller";
import { AuthDto } from "./auth.dto";

const router = Router();

router.post("/sign-in", validateRequest(AuthDto.signIn), AuthController.signIn);

router.post("/refresh", validateRequest(AuthDto.refresh), AuthController.refresh);

router.get(
  "/me",
  adminAuthGuard({ skipPasswordChange: true, allowedPermissions: ["read_address"] }),
  AuthController.me,
);

router.post("/sign-out", adminAuthGuard({ skipPasswordChange: true }), AuthController.signOut);

router.post(
  "/change-password",
  adminAuthGuard({ skipPasswordChange: true }),
  validateRequest(AuthDto.changePassword),
  AuthController.changePassword,
);

export const AuthRoutes = router;
