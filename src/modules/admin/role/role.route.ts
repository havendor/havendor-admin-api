import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/index.js";
import { adminAuthGuard } from "../../../middleware/index.js";
import { RoleController } from "./role.controller.js";
import { RoleDto } from "./role.dto.js";

const router = Router();

router.get("/permissions", adminAuthGuard({}), RoleController.getRolePermission);

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ROLE.CREATE] }),
  validateRequest(RoleDto.create),
  RoleController.create,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ROLE.UPDATE] }),
  validateRequest(RoleDto.update),
  RoleController.update,
);

router.get(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ROLE.READ] }),
  validateRequest(RoleDto.list),
  RoleController.getAll,
);

router.get(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ROLE.READ] }),
  validateRequest(RoleDto.single),
  RoleController.getSingle,
);

export const RoleRoute = router;
