import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { AdminPaymentController } from "./payment.controller.js";
import { AdminPaymentDto } from "./payment.dto.js";

const router = Router();

router.get(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT.READ] }),
  validateRequest(AdminPaymentDto.list),
  AdminPaymentController.list,
);

router.get(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT.READ] }),
  validateRequest(AdminPaymentDto.single),
  AdminPaymentController.details,
);

router.post(
  "/:id/verify",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT.VERIFY] }),
  validateRequest(AdminPaymentDto.verify),
  AdminPaymentController.verify,
);

router.post(
  "/:id/reject",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT.REJECT] }),
  validateRequest(AdminPaymentDto.reject),
  AdminPaymentController.reject,
);

export const AdminPaymentRoute = router;
