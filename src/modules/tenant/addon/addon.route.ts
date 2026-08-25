import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantAddonController } from "./addon.controller.js";
import { TenantAddonDto } from "./addon.dto.js";

const router = Router();
router.get("/", tenantAuthGuard(), TenantAddonController.listCatalog);
router.get(
  "/active",
  tenantAuthGuard(),
  validateRequest(TenantAddonDto.active),
  TenantAddonController.listActive,
);
router.get("/:id", tenantAuthGuard(), TenantAddonController.getAddonDetails);
router.post(
  "/checkout",
  tenantAuthGuard(),
  validateRequest(TenantAddonDto.checkout),
  TenantAddonController.checkout,
);
export const TenantAddonRoute = router;
