import { z } from "zod";
import { DatabaseDto } from "./database.dto.js";

export type TDatabaseCreateInput = z.infer<typeof DatabaseDto.create>["body"];
export type TDatabaseUpdateInput = z.infer<typeof DatabaseDto.update>["body"];
export type TDatabaseListQuery = z.infer<typeof DatabaseDto.list>["query"];
export type TDatabaseIdParam = z.infer<typeof DatabaseDto.single>["params"];
export type TDatabaseDrainInput = z.infer<typeof DatabaseDto.toggleDrain>["body"];
export type TDatabaseDefaultInput = z.infer<typeof DatabaseDto.setDefault>["body"];
