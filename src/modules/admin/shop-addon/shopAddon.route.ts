import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { ShopAddonController } from "./shopAddon.controller.js";
import { ShopAddonDto } from "./shopAddon.dto.js";

const router = Router();
router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP_ADDON.READ,
      PERMISSIONS.SHOP_ADDON.BLOCK,
      PERMISSIONS.SHOP_ADDON.UNBLOCK,
    ],
  }),
  validateRequest(ShopAddonDto.list),
  ShopAddonController.list,
);
router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SHOP_ADDON.READ,
      PERMISSIONS.SHOP_ADDON.BLOCK,
      PERMISSIONS.SHOP_ADDON.UNBLOCK,
    ],
  }),
  validateRequest(ShopAddonDto.single),
  ShopAddonController.single,
);
router.post(
  "/:id/block",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_ADDON.BLOCK] }),
  validateRequest(ShopAddonDto.block),
  ShopAddonController.block,
);
router.post(
  "/:id/unblock",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SHOP_ADDON.UNBLOCK] }),
  validateRequest(ShopAddonDto.unblock),
  ShopAddonController.unblock,
);
export const ShopAddonRoute = router;
