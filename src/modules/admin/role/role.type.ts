import { TPermission } from "../../../const";
import { Role } from "../../../generated/prisma";

export type TRoleCache = Pick<Role, "id" | "name" | "status"> & {
  permissions: TPermission[];
};
