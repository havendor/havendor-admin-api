import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantEntitlementController } from "./entitlement.controller.js";
import { TenantEntitlementDto } from "./entitlement.dto.js";

const router = Router();
router.get(
  "/",
  tenantAuthGuard(),
  validateRequest(TenantEntitlementDto.get),
  TenantEntitlementController.getForShop,
);
export const TenantEntitlementRoute = router;
