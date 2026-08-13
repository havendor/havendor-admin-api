import { z } from "zod";
import { PlanDto } from "./plan.dto.js";

export type TPlanCreateInput = z.infer<typeof PlanDto.create>["body"];
export type TPlanUpdateInput = z.infer<typeof PlanDto.update>["body"];
export type TPlanListQuery = z.infer<typeof PlanDto.list>["query"];
export type TPlanIdParam = z.infer<typeof PlanDto.single>["params"];
