import { z } from "zod";

const resolveDomain = z.object({
  query: z.object({
    domain: z
      .string({ error: "Domain query parameter is required" })
      .trim()
      .min(1, "Domain cannot be empty"),
  }),
});

const byDomain = z.object({
  params: z.object({
    domain: z
      .string({ error: "Domain parameter is required" })
      .trim()
      .min(1, "Domain cannot be empty"),
  }),
});

const byIdOrIdentity = z.object({
  params: z.object({
    idOrIdentity: z
      .string({ error: "Shop ID or Identity parameter is required" })
      .trim()
      .min(1, "Shop ID or Identity cannot be empty"),
  }),
});

export const InternalShopDto = {
  resolveDomain,
  byDomain,
  byIdOrIdentity,
};
