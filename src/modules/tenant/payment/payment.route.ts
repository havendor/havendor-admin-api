import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantPaymentController } from "./payment.controller.js";
import { TenantPaymentDto } from "./payment.dto.js";

const router = Router();

router.get("/payment-methods", tenantAuthGuard(), TenantPaymentController.listMethods);

router.post(
  "/payment/checkout",
  tenantAuthGuard(),
  validateRequest(TenantPaymentDto.checkout),
  TenantPaymentController.checkout,
);

router.get(
  "/payment",
  tenantAuthGuard(),
  validateRequest(TenantPaymentDto.listPayments),
  TenantPaymentController.listPayments,
);

router.get(
  "/payment/:id",
  tenantAuthGuard(),
  validateRequest(TenantPaymentDto.paymentId),
  TenantPaymentController.paymentDetails,
);

router.get(
  "/subscriptions/current",
  tenantAuthGuard(),
  validateRequest(TenantPaymentDto.currentSubscription),
  TenantPaymentController.currentSubscription,
);

export const TenantPaymentRoute = router;
