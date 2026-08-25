import { Logger } from "@havendor/server-core";
import { FeatureStatus, FeatureType } from "../generated/prisma/index.js";
import { prisma } from "../utility/index.js";

export const FEATURE_CATALOG = [
  {
    key: "orders_per_month",
    name: "Orders per month",
    description: "Maximum orders allowed per billing period",
    type: FeatureType.LIMIT,
  },
  {
    key: "storage_bytes",
    name: "Storage",
    description: "Maximum storage in bytes",
    type: FeatureType.LIMIT,
  },
  {
    key: "staff_accounts",
    name: "Staff accounts",
    description: "Maximum staff accounts",
    type: FeatureType.LIMIT,
  },
  {
    key: "custom_pages",
    name: "Custom pages",
    description: "Maximum custom pages",
    type: FeatureType.LIMIT,
  },
  {
    key: "custom_domain",
    name: "Custom domain",
    description: "Use a custom domain",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "gtm",
    name: "Google Tag Manager",
    description: "Setup GTM",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "advanced_dash",
    name: "Advanced dashboard",
    description: "Access advanced dashboard",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "webhooks",
    name: "Webhooks",
    description: "Use webhooks",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "api",
    name: "API access",
    description: "Use the public API",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "advanced_analytics",
    name: "Advanced analytics",
    description: "Use advanced analytics",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "priority_support",
    name: "Priority support",
    description: "Priority support access",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "facebook_capi",
    name: "Facebook CAPI",
    description: "Facebook Conversions API",
    type: FeatureType.BOOLEAN,
  },
  {
    key: "tiktok_events",
    name: "TikTok Events API",
    description: "TikTok Events API",
    type: FeatureType.BOOLEAN,
  },
] as const;

export type FeatureKey = (typeof FEATURE_CATALOG)[number]["key"];

export const seedFeatures = async () => {
  try {
    let created = 0;
    let skipped = 0;
    for (const feature of FEATURE_CATALOG) {
      const existing = await prisma.feature.findUnique({ where: { key: feature.key } });
      if (existing) {
        skipped += 1;
        continue;
      }
      await prisma.feature.create({
        data: {
          key: feature.key,
          name: feature.name,
          description: feature.description,
          type: feature.type,
          status: FeatureStatus.ACTIVE,
        },
      });
      created += 1;
    }
    Logger.app.info(`✅ Stage complete: Features — ${created} created, ${skipped} skipped`);
  } catch (error) {
    Logger.app.error("❌ Features seeding failed", error);
    throw error;
  }
};
