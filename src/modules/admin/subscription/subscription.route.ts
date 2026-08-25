import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { AdminSubscriptionController } from "./subscription.controller.js";
import { AdminSubscriptionDto } from "./subscription.dto.js";

const router = Router();

router.get(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SUBSCRIPTION.READ] }),
  validateRequest(AdminSubscriptionDto.list),
  AdminSubscriptionController.list,
);

router.get(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SUBSCRIPTION.READ] }),
  validateRequest(AdminSubscriptionDto.single),
  AdminSubscriptionController.details,
);

router.post(
  "/:id/block",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SUBSCRIPTION.BLOCK] }),
  validateRequest(AdminSubscriptionDto.block),
  AdminSubscriptionController.block,
);

router.post(
  "/:id/unblock",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SUBSCRIPTION.UNBLOCK] }),
  validateRequest(AdminSubscriptionDto.unblock),
  AdminSubscriptionController.unblock,
);

export const AdminSubscriptionRoute = router;
