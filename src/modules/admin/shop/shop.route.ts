import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { ShopController } from "./shop.controller.js";
import { ShopDto } from "./shop.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.CREATE] }),
  validateRequest(ShopDto.create),
  ShopController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP.READ,
      PERMISSIONS.SHOP.CREATE,
      PERMISSIONS.SHOP.UPDATE,
      PERMISSIONS.SHOP.DELETE,
    ],
  }),
  validateRequest(ShopDto.list),
  ShopController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP.READ,
      PERMISSIONS.SHOP.CREATE,
      PERMISSIONS.SHOP.UPDATE,
      PERMISSIONS.SHOP.DELETE,
    ],
  }),
  validateRequest(ShopDto.single),
  ShopController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.UPDATE] }),
  validateRequest(ShopDto.update),
  ShopController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.DELETE] }),
  validateRequest(ShopDto.remove),
  ShopController.softDelete,
);

router.patch(
  "/:id/approve",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.APPROVE] }),
  validateRequest(ShopDto.approve),
  ShopController.approve,
);

router.patch(
  "/:id/suspend",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.SUSPEND] }),
  validateRequest(ShopDto.suspend),
  ShopController.suspend,
);

router.patch(
  "/:id/restore",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP.RESTORE] }),
  validateRequest(ShopDto.restore),
  ShopController.restore,
);

export const ShopRoute = router;
