import z from "zod";
import { Admin } from "../../../generated/prisma/index.js";
import { TRoleCache } from "../role/role.type.js";
import { AdminDto } from "./admin.dto.js";

export type TAdminInputSchema = z.infer<typeof AdminDto.create>["body"];
export type TAdminUpdateSchema = z.infer<typeof AdminDto.update>["body"];
export type TAdminStatusUpdateSchema = z.infer<typeof AdminDto.updateStatus>;
export type TAdminIdParamSchema = z.infer<typeof AdminDto.update>["params"];

export type TAdminCache = Pick<Admin, "id" | "status"> & { role: TRoleCache; session_id: string };

export type TAdminListQuey = z.infer<typeof AdminDto.list>["query"];
