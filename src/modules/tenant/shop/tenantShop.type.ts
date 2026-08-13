import { z } from "zod";
import { TenantShopDto } from "./tenantShop.dto.js";

export type TTenantShopCreateInput = z.infer<typeof TenantShopDto.create>["body"];
export type TTenantShopUpdateInput = z.infer<typeof TenantShopDto.update>["body"];
export type TTenantShopListQuery = z.infer<typeof TenantShopDto.list>["query"];
export type TTenantShopIdParam = z.infer<typeof TenantShopDto.single>["params"];
