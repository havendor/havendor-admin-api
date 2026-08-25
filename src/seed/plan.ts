import { Logger } from "@havendor/server-core";
import { PlanSlug } from "../generated/prisma/index.js";
import { prisma } from "../utility/index.js";
import type { FeatureKey } from "./feature.js";

type PlanFeatureSeed = {
  key: FeatureKey;
  enabled?: boolean;
  limit_value?: bigint | number | null;
};

type PlanSeed = {
  slug: PlanSlug;
  name: string;
  description: string;
  is_active: boolean;
  price_monthly: number;
  price_yearly: number;
  features: PlanFeatureSeed[];
};

const PLAN_DATA: PlanSeed[] = [
  {
    slug: PlanSlug.STARTER,
    name: "Starter",
    description: "Perfect for getting started. Launch your first store with essential tools.",
    is_active: true,
    price_monthly: 0,
    price_yearly: 0,
    features: [
      { key: "orders_per_month", limit_value: 100 },
      { key: "storage_bytes", limit_value: 524288000 },
      { key: "staff_accounts", limit_value: 1 },
      { key: "custom_pages", limit_value: 3 },
      { key: "custom_domain", enabled: false },
      { key: "gtm", enabled: false },
      { key: "advanced_dash", enabled: false },
      { key: "webhooks", enabled: false },
      { key: "api", enabled: false },
      { key: "advanced_analytics", enabled: false },
      { key: "priority_support", enabled: false },
    ],
  },
  {
    slug: PlanSlug.GROWTH,
    name: "Growth",
    description:
      "For growing sellers who need the full stack. Unlock GTM, custom domain, and more.",
    is_active: true,
    price_monthly: 2900,
    price_yearly: 27840,
    features: [
      { key: "orders_per_month", limit_value: 2000 },
      { key: "storage_bytes", limit_value: 10737418240 },
      { key: "staff_accounts", limit_value: 5 },
      { key: "custom_pages", limit_value: 20 },
      { key: "custom_domain", enabled: true },
      { key: "gtm", enabled: true },
      { key: "advanced_dash", enabled: true },
      { key: "webhooks", enabled: true },
      { key: "api", enabled: false },
      { key: "advanced_analytics", enabled: false },
      { key: "priority_support", enabled: false },
    ],
  },
  {
    slug: PlanSlug.PRO,
    name: "Pro",
    description:
      "Power sellers. No compromises. Unlimited orders, full analytics, and priority support.",
    is_active: true,
    price_monthly: 7900,
    price_yearly: 75840,
    features: [
      { key: "orders_per_month", limit_value: null },
      { key: "storage_bytes", limit_value: 107374182400 },
      { key: "staff_accounts", limit_value: null },
      { key: "custom_pages", limit_value: null },
      { key: "custom_domain", enabled: true },
      { key: "gtm", enabled: true },
      { key: "advanced_dash", enabled: true },
      { key: "webhooks", enabled: true },
      { key: "api", enabled: true },
      { key: "advanced_analytics", enabled: true },
      { key: "priority_support", enabled: true },
    ],
  },
];

const syncPlanFeatures = async (planId: string, features: PlanFeatureSeed[]) => {
  const catalog = await prisma.feature.findMany({
    where: { key: { in: features.map((f) => f.key) }, deleted_at: null },
  });
  const byKey = new Map(catalog.map((f) => [f.key, f]));

  for (const item of features) {
    const feature = byKey.get(item.key);
    if (!feature) continue;
    const limit =
      item.limit_value === undefined
        ? undefined
        : item.limit_value == null
          ? null
          : BigInt(item.limit_value);
    await prisma.planFeature.upsert({
      where: {
        plan_id_feature_id: { plan_id: planId, feature_id: feature.id },
      },
      create: {
        plan_id: planId,
        feature_id: feature.id,
        enabled: item.enabled ?? true,
        limit_value: limit === undefined ? null : limit,
      },
      update: {
        enabled: item.enabled ?? true,
        ...(limit !== undefined ? { limit_value: limit } : {}),
      },
    });
  }
};

export const seedPlans = async () => {
  try {
    let created = 0;
    let synced = 0;
    for (const plan of PLAN_DATA) {
      const existing = await prisma.plan.findUnique({ where: { slug: plan.slug } });
      let planId: string;
      if (existing) {
        planId = existing.id;
        synced += 1;
      } else {
        const createdPlan = await prisma.plan.create({
          data: {
            slug: plan.slug,
            name: plan.name,
            description: plan.description,
            is_active: plan.is_active,
            price_monthly: plan.price_monthly,
            price_yearly: plan.price_yearly,
          },
        });
        planId = createdPlan.id;
        created += 1;
      }
      await syncPlanFeatures(planId, plan.features);
    }
    Logger.app.info(
      `✅ Stage complete: Plans — ${created} created, ${synced} existing (features synced)`,
    );
  } catch (error) {
    Logger.app.error("❌ Plans seeding failed", error);
    throw error;
  }
};
