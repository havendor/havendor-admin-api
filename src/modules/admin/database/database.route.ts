import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { DatabaseController } from "./database.controller.js";
import { DatabaseDto } from "./database.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.DATABASE.CREATE] }),
  validateRequest(DatabaseDto.create),
  DatabaseController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.DATABASE.READ,
      PERMISSIONS.DATABASE.CREATE,
      PERMISSIONS.DATABASE.UPDATE,
      PERMISSIONS.DATABASE.DELETE,
    ],
  }),
  validateRequest(DatabaseDto.list),
  DatabaseController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.DATABASE.READ,
      PERMISSIONS.DATABASE.CREATE,
      PERMISSIONS.DATABASE.UPDATE,
      PERMISSIONS.DATABASE.DELETE,
    ],
  }),
  validateRequest(DatabaseDto.single),
  DatabaseController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.DATABASE.UPDATE] }),
  validateRequest(DatabaseDto.update),
  DatabaseController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.DATABASE.DELETE] }),
  validateRequest(DatabaseDto.remove),
  DatabaseController.softDelete,
);

router.patch(
  "/:id/drain",
  adminAuthGuard({ has_access_to: [PERMISSIONS.DATABASE.DRAIN] }),
  validateRequest(DatabaseDto.toggleDrain),
  DatabaseController.toggleDrain,
);

router.patch(
  "/:id/default",
  adminAuthGuard({ has_access_to: [PERMISSIONS.DATABASE.SET_DEFAULT] }),
  validateRequest(DatabaseDto.setDefault),
  DatabaseController.setDefault,
);

export const DatabaseRoute = router;
