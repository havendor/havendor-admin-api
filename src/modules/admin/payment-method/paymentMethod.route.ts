import { validateRequest } from "@havendor/server-core";
import { NextFunction, Request, Response, Router } from "express";
import appConfig from "../../../config/appConfig.js";
import { PERMISSIONS } from "../../../const/permissions.js";
import { adminAuthGuard } from "../../../middleware/adminAuthGuard.js";
import { safeUploadAndModifyImages } from "../../../utility/index.js";
import { PaymentMethodController } from "./paymentMethod.controller.js";
import { PaymentMethodDto } from "./paymentMethod.dto.js";

const router = Router();

const mapThumb = (req: Request, _res: Response, next: NextFunction) => {
  const files = req.files as unknown as { [fieldname: string]: { key: string }[] };
  if (files?.thumb?.[0]?.key) {
    req.body.thumb_key = files.thumb[0].key;
  }
  next();
};

router.post(
  "/",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT_METHOD.CREATE] }),
  ...safeUploadAndModifyImages([
    {
      name: "thumb",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 200,
      width: 200,
      fit: "cover",
    },
  ]),
  mapThumb,
  validateRequest(PaymentMethodDto.createAndUpdate),
  PaymentMethodController.create,
);

router.get(
  "/",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.PAYMENT_METHOD.READ,
      PERMISSIONS.PAYMENT_METHOD.CREATE,
      PERMISSIONS.PAYMENT_METHOD.UPDATE,
      PERMISSIONS.PAYMENT_METHOD.DELETE,
    ],
  }),
  validateRequest(PaymentMethodDto.list),
  PaymentMethodController.list,
);

router.get(
  "/:id",
  adminAuthGuard({
    has_access_to: [
      PERMISSIONS.PAYMENT_METHOD.READ,
      PERMISSIONS.PAYMENT_METHOD.CREATE,
      PERMISSIONS.PAYMENT_METHOD.UPDATE,
      PERMISSIONS.PAYMENT_METHOD.DELETE,
    ],
  }),
  validateRequest(PaymentMethodDto.single),
  PaymentMethodController.single,
);

router.put(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT_METHOD.UPDATE] }),
  ...safeUploadAndModifyImages([
    {
      name: "thumb",
      maxCount: 1,
      bucket: appConfig.S3.DEFAULT_BUCKET,
      height: 200,
      width: 200,
      fit: "cover",
    },
  ]),
  mapThumb,
  validateRequest(PaymentMethodDto.update),
  PaymentMethodController.update,
);

router.delete(
  "/:id",
  adminAuthGuard({ has_access_to: [PERMISSIONS.PAYMENT_METHOD.DELETE] }),
  validateRequest(PaymentMethodDto.remove),
  PaymentMethodController.softDelete,
);

export const PaymentMethodRoute = router;
