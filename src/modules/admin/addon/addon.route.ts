import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { AddonController } from "./addon.controller.js";
import { AddonDto } from "./addon.dto.js";

const router = Router();
router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADDON.CREATE] }),
  validateRequest(AddonDto.create),
  AddonController.create,
);
router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.ADDON.READ,
      PERMISSIONS.ADDON.CREATE,
      PERMISSIONS.ADDON.UPDATE,
      PERMISSIONS.ADDON.DELETE,
    ],
  }),
  validateRequest(AddonDto.list),
  AddonController.list,
);
router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.ADDON.READ,
      PERMISSIONS.ADDON.CREATE,
      PERMISSIONS.ADDON.UPDATE,
      PERMISSIONS.ADDON.DELETE,
    ],
  }),
  validateRequest(AddonDto.single),
  AddonController.single,
);
router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADDON.UPDATE] }),
  validateRequest(AddonDto.update),
  AddonController.update,
);
router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADDON.DELETE] }),
  validateRequest(AddonDto.remove),
  AddonController.softDelete,
);
export const AddonRoute = router;
