import z from "zod";
import { TPermission } from "../../../const";
import { Role } from "../../../generated/prisma";
import { RoleDto } from "./role.dto";

export type TRoleCache = Pick<Role, "id" | "name" | "status"> & {
  permissions: TPermission[];
};

export type TRoleInputSchema = z.infer<typeof RoleDto.create>["body"];
export type TRoleUpdateSchema = z.infer<typeof RoleDto.update>["body"];
export type TRoleIdParamSchema = z.infer<typeof RoleDto.update>["params"];
export type TRoleListQuerySchema = z.infer<typeof RoleDto.list>["query"];
