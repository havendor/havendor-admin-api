import { z } from "zod";
import { ShopDomainDto } from "./shopDomain.dto.js";

export type TShopDomainCreateInput = z.infer<typeof ShopDomainDto.create>["body"];
export type TShopDomainUpdateInput = z.infer<typeof ShopDomainDto.update>["body"];
export type TShopDomainListQuery = z.infer<typeof ShopDomainDto.list>["query"];
export type TShopDomainIdParam = z.infer<typeof ShopDomainDto.single>["params"];
export type TShopDomainSslInput = z.infer<typeof ShopDomainDto.manageSsl>["body"];
