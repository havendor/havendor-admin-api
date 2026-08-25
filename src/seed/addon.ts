import { Logger } from "@havendor/server-core";
import { prisma } from "../utility/index.js";
import type { FeatureKey } from "./feature.js";

type AddonSeed = {
  slug: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  feature_keys: FeatureKey[];
};

const ADDON_DATA: AddonSeed[] = [
  {
    slug: "facebook-capi",
    name: "Facebook CAPI",
    description: "Track conversions with Facebook Conversions API.",
    price_monthly: 800,
    price_yearly: 7680,
    feature_keys: ["facebook_capi"],
  },
  {
    slug: "tiktok-events",
    name: "TikTok Events API",
    description: "Track customer events directly with TikTok.",
    price_monthly: 800,
    price_yearly: 7680,
    feature_keys: ["tiktok_events"],
  },
];

export const seedAddons = async () => {
  try {
    let created = 0;
    let synced = 0;
    for (const addon of ADDON_DATA) {
      const existing = await prisma.addon.findUnique({ where: { slug: addon.slug } });
      let addonId: string;
      if (existing) {
        addonId = existing.id;
        synced += 1;
      } else {
        const row = await prisma.addon.create({
          data: {
            slug: addon.slug,
            name: addon.name,
            description: addon.description,
            is_active: true,
            price_monthly: addon.price_monthly,
            price_yearly: addon.price_yearly,
          },
        });
        addonId = row.id;
        created += 1;
      }

      const features = await prisma.feature.findMany({
        where: { key: { in: addon.feature_keys }, deleted_at: null },
      });
      for (const feature of features) {
        await prisma.addonFeature.upsert({
          where: {
            addon_id_feature_id: { addon_id: addonId, feature_id: feature.id },
          },
          create: {
            addon_id: addonId,
            feature_id: feature.id,
            enabled: true,
            limit_value: null,
          },
          update: { enabled: true },
        });
      }
    }
    Logger.app.info(
      `✅ Stage complete: Add-ons — ${created} created, ${synced} existing (features synced)`,
    );
  } catch (error) {
    Logger.app.error("❌ Add-ons seeding failed", error);
    throw error;
  }
};
