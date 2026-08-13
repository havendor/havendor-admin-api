// =============================================================================
// PLAN SEED DATA
// =============================================================================

import { Logger } from "@havendor/server-core";
import { PlanSlug, Prisma } from "../generated/prisma/index.js";
import { prisma } from "../utility/index.js";

const PLAN_DATA: Prisma.PlanCreateInput[] = [
  {
    slug: PlanSlug.STARTER,
    name: "Starter",
    description: "Perfect for getting started. Launch your first store with essential tools.",
    is_active: true,

    price_monthly: 0, // free
    price_yearly: 0,

    // ── Limits ──────────────────────────────────────────────────────────────
    max_orders_per_month: 100,
    max_storage_bytes: BigInt(524288000), // 500 MB
    max_staff_accounts: 1,
    max_custom_pages: 3,

    // ── Feature flags ────────────────────────────────────────────────────────
    can_use_custom_domain: false,
    can_setup_gtm: false,
    can_access_advanced_dash: false,
    can_use_webhooks: false,
    can_use_api: false,
    can_use_advanced_analytics: false,
    has_priority_support: false,
  },
  {
    slug: PlanSlug.GROWTH,
    name: "Growth",
    description:
      "For growing sellers who need the full stack. Unlock GTM, custom domain, and more.",
    is_active: true,

    price_monthly: 2900, // $29.00
    price_yearly: 27840, // $278.40 (~20% off)

    // ── Limits ──────────────────────────────────────────────────────────────
    max_orders_per_month: 2000,
    max_storage_bytes: BigInt(10737418240), // 10 GB
    max_staff_accounts: 5,
    max_custom_pages: 20,

    // ── Feature flags ────────────────────────────────────────────────────────
    can_use_custom_domain: true,
    can_setup_gtm: true,
    can_access_advanced_dash: true,
    can_use_webhooks: true,
    can_use_api: false,
    can_use_advanced_analytics: false,
    has_priority_support: false,
  },
  {
    slug: PlanSlug.PRO,
    name: "Pro",
    description:
      "Power sellers. No compromises. Unlimited orders, full analytics, and priority support.",
    is_active: true,

    price_monthly: 7900, // $79.00
    price_yearly: 75840, // $758.40 (~20% off)

    // ── Limits (null = unlimited) ────────────────────────────────────────────
    max_orders_per_month: null,
    max_storage_bytes: BigInt(107374182400), // 100 GB
    max_staff_accounts: null,
    max_custom_pages: null,

    // ── Feature flags ────────────────────────────────────────────────────────
    can_use_custom_domain: true,
    can_setup_gtm: true,
    can_access_advanced_dash: true,
    can_use_webhooks: true,
    can_use_api: true,
    can_use_advanced_analytics: true,
    has_priority_support: true,
  },
];

// =============================================================================
// SEEDER
// =============================================================================

export const seedPlans = async () => {
  try {
    // Fetch all slugs that already exist in the DB
    const existingPlans = await prisma.plan.findMany({
      select: { slug: true },
    });

    const existingSlugs = new Set(existingPlans.map((p) => p.slug));

    const missingSlugs = PLAN_DATA.filter((p) => !existingSlugs.has(p.slug as PlanSlug));
    const skipped = PLAN_DATA.length - missingSlugs.length;

    if (missingSlugs.length === 0) {
      Logger.app.info(`⏭️  Stage skip: Plans — all plans already exist (${skipped} skipped)`);
      return;
    }

    Logger.app.info(
      `⚙️  Creating ${missingSlugs.length} missing plan(s): ${missingSlugs
        .map((p) => p.slug)
        .join(", ")}`,
    );

    // Create only the missing ones
    await prisma.plan.createMany({
      data: missingSlugs,
      skipDuplicates: true, // safety net
    });

    Logger.app.info(
      `✅ Stage complete: Plans — ${missingSlugs.length} plan(s) created, ${skipped} skipped`,
    );
  } catch (error) {
    Logger.app.error("❌ Plans seeding failed", error);
    throw error;
  }
};
