import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { ShopDomainController } from "./shopDomain.controller.js";
import { ShopDomainDto } from "./shopDomain.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.CREATE] }),
  validateRequest(ShopDomainDto.create),
  ShopDomainController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP_DOMAIN.READ,
      PERMISSIONS.SHOP_DOMAIN.CREATE,
      PERMISSIONS.SHOP_DOMAIN.UPDATE,
      PERMISSIONS.SHOP_DOMAIN.DELETE,
    ],
  }),
  validateRequest(ShopDomainDto.list),
  ShopDomainController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP_DOMAIN.READ,
      PERMISSIONS.SHOP_DOMAIN.CREATE,
      PERMISSIONS.SHOP_DOMAIN.UPDATE,
      PERMISSIONS.SHOP_DOMAIN.DELETE,
    ],
  }),
  validateRequest(ShopDomainDto.single),
  ShopDomainController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.UPDATE] }),
  validateRequest(ShopDomainDto.update),
  ShopDomainController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.DELETE] }),
  validateRequest(ShopDomainDto.remove),
  ShopDomainController.softDelete,
);

router.post(
  "/:id/verify",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.VERIFY] }),
  validateRequest(ShopDomainDto.verify),
  ShopDomainController.verifyDns,
);

router.patch(
  "/:id/primary",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.SET_PRIMARY] }),
  validateRequest(ShopDomainDto.setPrimary),
  ShopDomainController.setPrimary,
);

router.patch(
  "/:id/ssl",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.MANAGE_SSL] }),
  validateRequest(ShopDomainDto.manageSsl),
  ShopDomainController.manageSsl,
);

router.post(
  "/:id/ssl/claim",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_DOMAIN.MANAGE_SSL] }),
  validateRequest(ShopDomainDto.claimSSL),
  ShopDomainController.claimSSL,
);

export const ShopDomainRoute = router;
