import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantAuthController } from "./tenantAuth.controller.js";
import { TenantAuthDto } from "./tenantAuth.dto.js";

const router = Router();

router.post("/sign-up", validateRequest(TenantAuthDto.signUp), TenantAuthController.signUp);

router.post("/sign-in", validateRequest(TenantAuthDto.signIn), TenantAuthController.signIn);

router.post("/refresh", validateRequest(TenantAuthDto.refresh), TenantAuthController.refresh);

router.get("/me", tenantAuthGuard({ skip_password_change: true }), TenantAuthController.me);

router.post(
  "/sign-out",
  tenantAuthGuard({ skip_password_change: true }),
  TenantAuthController.signOut,
);

router.post(
  "/change-password",
  tenantAuthGuard({ skip_password_change: true }),
  validateRequest(TenantAuthDto.changePassword),
  TenantAuthController.changePassword,
);

router.get("/session", tenantAuthGuard({}), TenantAuthController.allSessions);

router.delete(
  "/session/:id",
  tenantAuthGuard({}),
  validateRequest(TenantAuthDto.deleteSession),
  TenantAuthController.deleteSession,
);

export const TenantAuthRoutes = router;
