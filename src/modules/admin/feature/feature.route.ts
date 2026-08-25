import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { FeatureController } from "./feature.controller.js";
import { FeatureDto } from "./feature.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.FEATURE.CREATE] }),
  validateRequest(FeatureDto.create),
  FeatureController.create,
);
router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.FEATURE.READ,
      PERMISSIONS.FEATURE.CREATE,
      PERMISSIONS.FEATURE.UPDATE,
      PERMISSIONS.FEATURE.DELETE,
    ],
  }),
  validateRequest(FeatureDto.list),
  FeatureController.list,
);
router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.FEATURE.READ,
      PERMISSIONS.FEATURE.CREATE,
      PERMISSIONS.FEATURE.UPDATE,
      PERMISSIONS.FEATURE.DELETE,
    ],
  }),
  validateRequest(FeatureDto.single),
  FeatureController.single,
);
router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.FEATURE.UPDATE] }),
  validateRequest(FeatureDto.update),
  FeatureController.update,
);
router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.FEATURE.DELETE] }),
  validateRequest(FeatureDto.remove),
  FeatureController.softDelete,
);

export const FeatureRoute = router;
