import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { internalSecurityGuard } from "../../../middleware/index.js";
import { InternalShopController } from "./internalShop.controller.js";
import { InternalShopDto } from "./internalShop.dto.js";

const router = Router();

// Apply internal security guard to all internal shop routes
router.use(internalSecurityGuard());

// Query-based domain resolution (e.g. /resolve?domain=store.havendor.com)
router.get(
  "/resolve",
  validateRequest(InternalShopDto.resolveDomain),
  InternalShopController.resolveByDomain,
);

// Domain-based endpoints
router.get(
  "/by-domain/:domain/database",
  validateRequest(InternalShopDto.byDomain),
  InternalShopController.getDatabaseInfo,
);

router.get(
  "/by-domain/:domain/subscription",
  validateRequest(InternalShopDto.byDomain),
  InternalShopController.getSubscriptionInfo,
);

router.get(
  "/by-domain/:domain/entitlements",
  validateRequest(InternalShopDto.byDomain),
  InternalShopController.getEntitlements,
);

router.get(
  "/by-domain/:domain",
  validateRequest(InternalShopDto.byDomain),
  InternalShopController.resolveByDomain,
);

// Identifier (ID or Identity) based endpoints
router.get(
  "/:idOrIdentity/database",
  validateRequest(InternalShopDto.byIdOrIdentity),
  InternalShopController.getDatabaseInfo,
);

router.get(
  "/:idOrIdentity/subscription",
  validateRequest(InternalShopDto.byIdOrIdentity),
  InternalShopController.getSubscriptionInfo,
);

router.get(
  "/:idOrIdentity/entitlements",
  validateRequest(InternalShopDto.byIdOrIdentity),
  InternalShopController.getEntitlements,
);

router.get(
  "/:idOrIdentity",
  validateRequest(InternalShopDto.byIdOrIdentity),
  InternalShopController.getByIdOrIdentity,
);

export const InternalShopRoute = router;
