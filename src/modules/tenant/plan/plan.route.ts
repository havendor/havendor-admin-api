import { Router } from "express";
import { tenantAuthGuard } from "../../../middleware/tenantAuthGuard.js";
import { TenantPlanController } from "./plan.controller.js";

const router = Router();

router.get("/", tenantAuthGuard(), TenantPlanController.listActivePlans);
router.get("/:id", tenantAuthGuard(), TenantPlanController.getPlanDetails);

export const TenantPlanRoute = router;
