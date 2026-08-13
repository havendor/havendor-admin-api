import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { PlanController } from "./plan.controller.js";
import { PlanDto } from "./plan.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PLAN.CREATE] }),
  validateRequest(PlanDto.create),
  PlanController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.PLAN.READ,
      PERMISSIONS.PLAN.CREATE,
      PERMISSIONS.PLAN.UPDATE,
      PERMISSIONS.PLAN.DELETE,
    ],
  }),
  validateRequest(PlanDto.list),
  PlanController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.PLAN.READ,
      PERMISSIONS.PLAN.CREATE,
      PERMISSIONS.PLAN.UPDATE,
      PERMISSIONS.PLAN.DELETE,
    ],
  }),
  validateRequest(PlanDto.single),
  PlanController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PLAN.UPDATE] }),
  validateRequest(PlanDto.update),
  PlanController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PLAN.DELETE] }),
  validateRequest(PlanDto.remove),
  PlanController.softDelete,
);

export const PlanRoute = router;
