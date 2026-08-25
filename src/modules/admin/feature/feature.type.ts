import { z } from "zod";
import { FeatureDto } from "./feature.dto.js";

export type TFeatureCreateInput = z.infer<typeof FeatureDto.create>["body"];
export type TFeatureUpdateInput = z.infer<typeof FeatureDto.update>["body"];
export type TFeatureListQuery = z.infer<typeof FeatureDto.list>["query"];
