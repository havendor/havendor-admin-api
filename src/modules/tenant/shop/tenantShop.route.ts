import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantShopController } from "./tenantShop.controller.js";
import { TenantShopDto } from "./tenantShop.dto.js";

const router = Router();

router.post(
  "/",
  tenantAuthGuard({}),
  validateRequest(TenantShopDto.create),
  TenantShopController.create,
);

router.get(
  "/",
  tenantAuthGuard({}),
  validateRequest(TenantShopDto.list),
  TenantShopController.list,
);

router.get(
  "/:id",
  tenantAuthGuard({}),
  validateRequest(TenantShopDto.single),
  TenantShopController.single,
);

router.patch(
  "/:id",
  tenantAuthGuard({}),
  validateRequest(TenantShopDto.update),
  TenantShopController.update,
);

router.delete(
  "/:id",
  tenantAuthGuard({}),
  validateRequest(TenantShopDto.remove),
  TenantShopController.remove,
);

export const TenantShopRoutes = router;
