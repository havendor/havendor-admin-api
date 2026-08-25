import { Router } from "express";
import { internalSecurityGuard } from "../../../middleware/index.js";
import { InternalHealthController } from "./internalHealth.controller.js";

const router = Router();

router.use(internalSecurityGuard());

router.get("/", InternalHealthController.getInternalHealth);

export const InternalHealthRoute = router;
