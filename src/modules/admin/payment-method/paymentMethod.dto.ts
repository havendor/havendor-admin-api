import { z } from "zod";
import {
  ColumnGenericStatus,
  PaymentMethodType,
  PaymentProvider,
} from "../../../generated/prisma/index.js";

export const RequiredInputsSchema = z
  .object({
    type: z.enum(["text", "radio", "select"]).default("text"),
    name: z.string().min(1, { error: "Name is required." }),
    hash: z
      .string()
      .optional()
      .transform((val) => val || crypto.randomUUID()),
    is_required: z.boolean().default(false),
    enums: z
      .union([z.string(), z.array(z.string())])
      .nullable()
      .optional()
      .transform((val) => {
        if (val == null) return null;
        if (Array.isArray(val)) return val;
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }),
  })
  .superRefine((data, ctx) => {
    if (data.type !== "text" && (!data.enums || data.enums.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["enums"],
        message: "Enums are required when type is not text.",
      });
    }
  });

// Base object shape without refinements — required so .partial() can be applied
// on the update schema (Zod v4 forbids .partial() on refined schemas).
const createAndUpdateBody = z.object({
  name: z.string().min(1, { error: "Name is required." }),
  description: z.string().optional().nullable().default(null),
  thumb_key: z.string().optional().nullable().default(null),
  type: z.enum(PaymentMethodType).default(PaymentMethodType.MANUAL),
  provider: z.enum(PaymentProvider).optional(),
  status: z
    .enum([ColumnGenericStatus.ACTIVE, ColumnGenericStatus.INACTIVE, ColumnGenericStatus.PENDING])
    .optional()
    .default(ColumnGenericStatus.ACTIVE),
  is_default: z.boolean().optional().default(false),
  sort_order: z.coerce.number().int().optional().default(1),
  required_inputs: z
    .array(RequiredInputsSchema)
    .optional()
    .nullable()
    .default(null)
    .transform((val) => (val?.length ? val : null)),
});

// Typed as Partial so this same function can be reused on both the full and
// partial (update) body — every field access is already safely guarded.
const paymentMethodBodyRefinement = (
  data: Partial<z.infer<typeof createAndUpdateBody>>,
  ctx: z.RefinementCtx,
) => {
  if (data.type === PaymentMethodType.AUTOMATED) {
    if (!data.provider || data.provider === PaymentProvider.MANUAL) {
      ctx.addIssue({
        code: "custom",
        path: ["provider"],
        message: "Automated methods require STRIPE or SSLCOMMERZ provider.",
      });
    }
    if (data.required_inputs?.length) {
      ctx.addIssue({
        code: "custom",
        path: ["required_inputs"],
        message: "Automated methods cannot have required_inputs.",
      });
    }
  } else if (data.provider && data.provider !== PaymentProvider.MANUAL) {
    ctx.addIssue({
      code: "custom",
      path: ["provider"],
      message: "Manual methods must use MANUAL provider.",
    });
  }
};

const createAndUpdate = z.object({
  body: createAndUpdateBody.superRefine(paymentMethodBodyRefinement),
});

const list = z.object({
  query: z
    .object({
      search: z.string().optional(),
      type: z.enum(PaymentMethodType).optional(),
      status: z.enum(ColumnGenericStatus).optional(),
      provider: z.enum(PaymentProvider).optional(),
      page: z.coerce.number().optional(),
      limit: z.coerce.number().optional(),
      sort_by: z.string().optional(),
      sort_order: z.enum(["asc", "desc"]).optional(),
    })
    .optional(),
});

const single = z.object({
  params: z.object({ id: z.string().min(1) }),
});

const update = z.object({
  params: z.object({ id: z.string().min(1) }),
  // .partial() must be called on the unrefined base object (Zod v4 constraint),
  // then the cross-field refinement is re-applied on top.
  body: createAndUpdateBody.partial().superRefine(paymentMethodBodyRefinement),
});

export const PaymentMethodDto = {
  createAndUpdate,
  list,
  single,
  update,
  remove: single,
};
