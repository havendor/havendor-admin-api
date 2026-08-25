import { z } from "zod";
export const TenantEntitlementDto = {
  get: z.object({ query: z.object({ shop_id: z.string().min(1) }) }),
};
