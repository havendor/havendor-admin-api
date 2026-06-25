import z from "zod";
import { TenantDto, tenantSchema } from "./tenant.dto.js";

export type TTenantPayload = z.infer<typeof tenantSchema>;
export type TTenantListQuery = z.infer<typeof TenantDto.list>["query"];
