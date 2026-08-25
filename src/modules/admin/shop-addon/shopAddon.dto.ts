import { commonQuerySchema } from "@havendor/server-core";
import { z } from "zod";
import { SubscriptionStatus } from "../../../generated/prisma/index.js";

export const ShopAddonDto = {
  list: z.object({
    query: commonQuerySchema.safeExtend({
      shop_id: z.uuid().optional(),
      addon_id: z.uuid().optional(),
      status: z.enum(SubscriptionStatus).optional(),
    }),
  }),
  single: z.object({ params: z.object({ id: z.uuid() }) }),
  block: z.object({
    params: z.object({ id: z.uuid() }),
    body: z.object({ reason: z.string().nullish() }),
  }),
  unblock: z.object({ params: z.object({ id: z.uuid() }) }),
};
