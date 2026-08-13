import { z } from "zod";
import { ShopDto } from "./shop.dto.js";

export type TShopCreateInput = z.infer<typeof ShopDto.create>["body"];
export type TShopUpdateInput = z.infer<typeof ShopDto.update>["body"];
export type TShopListQuery = z.infer<typeof ShopDto.list>["query"];
export type TShopIdParam = z.infer<typeof ShopDto.single>["params"];
