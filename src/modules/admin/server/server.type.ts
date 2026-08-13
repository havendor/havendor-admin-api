import { z } from "zod";
import { ServerDto } from "./server.dto.js";

export type TServerCreateInput = z.infer<typeof ServerDto.create>["body"];
export type TServerUpdateInput = z.infer<typeof ServerDto.update>["body"];
export type TServerListQuery = z.infer<typeof ServerDto.list>["query"];
export type TServerIdParam = z.infer<typeof ServerDto.single>["params"];
export type TServerDrainInput = z.infer<typeof ServerDto.toggleDrain>["body"];
export type TServerDefaultInput = z.infer<typeof ServerDto.setDefault>["body"];
