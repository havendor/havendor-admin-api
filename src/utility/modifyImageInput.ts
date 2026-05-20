import { NextFunction, Request, Response } from "express";
/* eslint-disable @typescript-eslint/no-explicit-any */
export const modifyImageInput =
  (fieldNames: string[]) => (req: Request, _res: Response, next: NextFunction) => {
    const files = req.files as unknown as { [fieldname: string]: { key: string }[] };

    const fileData: Record<string, string | null> = {};

    fieldNames.forEach((fieldName) => {
      fileData[fieldName] = files?.[fieldName]?.[0]?.key || req.body?.[fieldName] || null;
    });

    const toPlainObject = (obj: any): any => {
      if (Array.isArray(obj)) return obj.map(toPlainObject);
      if (obj && typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toPlainObject(v)]));
      }
      return obj;
    };

    req.body = {
      ...toPlainObject(req.body),
      ...fileData,
    };
    next();
  };
