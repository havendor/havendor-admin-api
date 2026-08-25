import { z } from "zod";
import { AddonDto } from "./addon.dto.js";
export type TAddonCreateInput = z.infer<typeof AddonDto.create>["body"];
export type TAddonUpdateInput = z.infer<typeof AddonDto.update>["body"];
export type TAddonListQuery = z.infer<typeof AddonDto.list>["query"];
