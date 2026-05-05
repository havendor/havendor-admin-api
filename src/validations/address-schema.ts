import { mobileNumberSchema } from "@havendor/server-core";
import z from "zod";

export const addressSchema = () =>
  z.object({
    address_name: z.string({ error: "Address name is required" }).min(1, {
      message: "Address name can not be empty.",
    }),
    full_name: z.string().nullish(),
    mobile: mobileNumberSchema().nullish(),
    email: z.email().nullish(),
    address_line_1: z.string({ error: "Address line 1 is required" }).min(1, {
      message: "Address line 1 can not be empty.",
    }),
    address_line_2: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    zip_code: z.string().nullish(),
    country: z.string().nullish(),
  });
