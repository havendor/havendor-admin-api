import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { adminAuthGuard } from "../../../middleware/index.js";
import { AuthController } from "./auth.controller.js";
import { AuthDto } from "./auth.dto.js";

const router = Router();

router.post("/sign-in", validateRequest(AuthDto.signIn), AuthController.signIn);

router.post("/refresh", validateRequest(AuthDto.refresh), AuthController.refresh);

router.get("/me", adminAuthGuard({ skip_password_change: true }), AuthController.me);

router.post("/sign-out", adminAuthGuard({ skip_password_change: true }), AuthController.signOut);

router.post(
  "/change-password",
  adminAuthGuard({ skip_password_change: true }),
  validateRequest(AuthDto.changePassword),
  AuthController.changePassword,
);

router.get("/session", adminAuthGuard({}), AuthController.allSessions);

router.delete(
  "/session/:id",
  adminAuthGuard({}),
  validateRequest(AuthDto.deleteSession),
  AuthController.deleteSession,
);

export const AuthRoutes = router;
