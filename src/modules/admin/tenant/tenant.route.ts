import { uploadAndModifyImages, validateRequest } from "@havendor/server-core";
import { Router } from "express";
import appConfig from "../../../config/appConfig.js";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { TenantController } from "./tenant.controller.js";
import { TenantDto } from "./tenant.dto.js";

const router = Router();

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.TENANT.CREATE] }),
  ...uploadAndModifyImages([
    {
      name: "profile_image",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 500,
      width: 500,
      fit: "cover",
    },
  ]),
  validateRequest(TenantDto.create),
  TenantController.createTenant,
);

// List tenants
router.get(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.TENANT.READ] }),
  validateRequest(TenantDto.list),
  TenantController.readAllTenants,
);

// Get single tenant
router.get(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.TENANT.READ] }),
  validateRequest(TenantDto.single),
  TenantController.getSingleTenant,
);

// Update tenant
router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.TENANT.UPDATE] }),
  ...uploadAndModifyImages([
    {
      name: "profile_image",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 500,
      width: 500,
      fit: "cover",
    },
  ]),
  validateRequest(TenantDto.update),
  TenantController.updateTenant,
);

// Delete (soft) tenant
router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.TENANT.DELETE] }),
  validateRequest(TenantDto.remove),
  TenantController.deleteTenant,
);

export const TenantRoute = router;
