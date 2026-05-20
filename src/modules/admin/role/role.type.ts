import z from "zod";
import { TPermission } from "../../../const/index.js";
import { Role } from "../../../generated/prisma/index.js";
import { RoleDto } from "./role.dto.js";

export type TRoleCache = Pick<Role, "id" | "name" | "status"> & {
  permissions: TPermission[];
};

export type TRoleInputSchema = z.infer<typeof RoleDto.create>["body"];
export type TRoleUpdateSchema = z.infer<typeof RoleDto.update>["body"];
export type TRoleIdParamSchema = z.infer<typeof RoleDto.update>["params"];
export type TRoleListQuerySchema = z.infer<typeof RoleDto.list>["query"];
