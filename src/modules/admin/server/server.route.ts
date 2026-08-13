import { validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { ServerController } from "./server.controller.js";
import { ServerDto } from "./server.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SERVER.CREATE] }),
  validateRequest(ServerDto.create),
  ServerController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SERVER.READ,
      PERMISSIONS.SERVER.CREATE,
      PERMISSIONS.SERVER.UPDATE,
      PERMISSIONS.SERVER.DELETE,
    ],
  }),
  validateRequest(ServerDto.list),
  ServerController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.SERVER.READ,
      PERMISSIONS.SERVER.CREATE,
      PERMISSIONS.SERVER.UPDATE,
      PERMISSIONS.SERVER.DELETE,
    ],
  }),
  validateRequest(ServerDto.single),
  ServerController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SERVER.UPDATE] }),
  validateRequest(ServerDto.update),
  ServerController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SERVER.DELETE] }),
  validateRequest(ServerDto.remove),
  ServerController.softDelete,
);

router.patch(
  "/:id/drain",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SERVER.DRAIN] }),
  validateRequest(ServerDto.toggleDrain),
  ServerController.toggleDrain,
);

router.patch(
  "/:id/default",
  adminAuthGuard({ has_access_to: [PERMISSIONS.SERVER.SET_DEFAULT] }),
  validateRequest(ServerDto.setDefault),
  ServerController.setDefault,
);

export const ServerRoute = router;
