import { createHash, randomUUID } from "crypto";
import { BillingInterval, Plan, PlanSlug } from "../../generated/prisma/index.js";
import {
  TPaymentInfoSnapshot,
  TPaymentInfoSubmit,
  TPaymentRequiredInput,
} from "./payment.types.js";

export const createSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || randomUUID();

export const planAmount = (plan: Plan, interval: BillingInterval) =>
  interval === BillingInterval.YEARLY ? plan.price_yearly : plan.price_monthly;

export const periodDates = (interval: BillingInterval, from = new Date()) => {
  const start = new Date(from);
  const end = new Date(from);
  if (interval === BillingInterval.YEARLY) {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }
  return { current_period_start: start, current_period_end: end };
};

export const isFreePlan = (plan: Plan) =>
  plan.slug === PlanSlug.STARTER || (plan.price_monthly === 0 && plan.price_yearly === 0);

export const currencyForProvider = (provider: string) => {
  if (provider === "STRIPE") return "usd";
  return "bdt";
};

export const buildIdempotencyKey = (parts: string[]) =>
  createHash("sha256").update(parts.join(":")).digest("hex").slice(0, 48);

export const validatePaymentInfo = (
  requiredInputs: TPaymentRequiredInput[] | null | undefined,
  paymentInfo: TPaymentInfoSubmit[] | null | undefined,
): TPaymentInfoSnapshot[] => {
  const inputs = requiredInputs || [];
  const submitted = paymentInfo || [];
  const snapshot: TPaymentInfoSnapshot[] = [];
  const errors: Record<string, string[]> = {};

  for (const field of inputs) {
    const current = submitted.find((i) => i.hash === field.hash);
    if (
      field.is_required &&
      (current === undefined || current.value == null || current.value === "")
    ) {
      errors[`payment_info.${field.hash}`] = [`${field.name} is required.`];
    }
    snapshot.push({
      name: field.name,
      hash: field.hash,
      value: current?.value ?? null,
    });
  }

  if (Object.keys(errors).length) {
    const err = new Error("Payment info validation failed") as Error & {
      fieldErrors: Record<string, string[]>;
    };
    err.fieldErrors = errors;
    throw err;
  }

  return snapshot;
};

export const extractTransactionId = (snapshot: TPaymentInfoSnapshot[]) => {
  const trx = snapshot.find(
    (s) => /transaction|trx|tran/i.test(s.name) || /transaction|trx|tran/i.test(s.hash),
  );
  return trx?.value || snapshot[0]?.value || null;
};
