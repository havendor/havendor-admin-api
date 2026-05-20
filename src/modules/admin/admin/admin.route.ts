import { uploadAndModifyImages, validateRequest } from "@havendor/server-core";
import { Router } from "express";
import { appConfig } from "../../../config";
import { PERMISSIONS } from "../../../const";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard";
import { AdminController } from "./admin.controller";
import { AdminDto } from "./admin.dto";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.CREATE] }),
  ...uploadAndModifyImages([
    {
      name: "profile_image",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 500,
      width: 500,
      fit: "cover",
    },
    { name: "identity_document", maxCount: 1, bucket: appConfig.S3.PRIVATE_BUCKET },
  ]),
  validateRequest(AdminDto.create),
  AdminController.createAdmin,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.UPDATE] }),
  ...uploadAndModifyImages([
    {
      name: "profile_image",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 500,
      width: 500,
      fit: "cover",
    },
    { name: "identity_document", maxCount: 1, bucket: appConfig.S3.PRIVATE_BUCKET },
  ]),
  validateRequest(AdminDto.update),
  AdminController.updateAdmin,
);

router.patch(
  "/:id/reset-password",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.RESET_PASSWORD] }),
  validateRequest(AdminDto.resetPassword),
  AdminController.resetPasswordAdmin,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.DELETE] }),
  validateRequest(AdminDto.remove),
  AdminController.deleteAdmin,
);

router.get(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.READ] }),
  validateRequest(AdminDto.list),
  AdminController.readAllAdmins,
);

router.get(
  "/options",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.READ] }),
  AdminController.getAdminOptions,
);

router.get(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.ADMIN.READ] }),
  validateRequest(AdminDto.single),
  AdminController.getSingleAdmin,
);
export const AdminRoute = router;
