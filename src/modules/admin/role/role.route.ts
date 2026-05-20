import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard";
import { RoleController } from "./role.controller";
import { RoleDto } from "./role.dto";

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
