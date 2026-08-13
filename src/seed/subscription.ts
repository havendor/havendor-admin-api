import { Logger } from "@havendor/server-core";
import {
  BillingInterval,
  ColumnGenericStatus,
  PlanSlug,
  ServerEnvironment,
  ServerHealthStatus,
  ServerLocation,
  ServerProvider,
  SubscriptionStatus,
} from "../generated/prisma/index.js";
import { prisma } from "../utility/prisma.js";
import { DUMMY_DATABASE_SLUG } from "./database.js";
import { DUMMY_TENANT_EMAIL } from "./index.js";

const DUMMY_SHOP_IDENTITY = "S00000001";
const DUMMY_SERVER_SLUG = "dummy-local-01";

const schemaNameFromIdentity = (identity: string) => `shop_${identity.toLowerCase()}`;

export const seedSubscription = async () => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: { email: DUMMY_TENANT_EMAIL },
    });

    if (!tenant) {
      Logger.app.info(
        `⏭️  Stage skip: Subscription — dummy tenant (${DUMMY_TENANT_EMAIL}) not found`,
      );
      return;
    }

    const plan = await prisma.plan.findUnique({
      where: { slug: PlanSlug.STARTER },
    });

    if (!plan) {
      Logger.app.info("⏭️  Stage skip: Subscription — STARTER plan not found");
      return;
    }

    const database = await prisma.database.findUnique({
      where: { slug: DUMMY_DATABASE_SLUG },
    });

    if (!database) {
      Logger.app.info(
        `⏭️  Stage skip: Subscription — dummy database (${DUMMY_DATABASE_SLUG}) not found; run Database seed first`,
      );
      return;
    }

    let serverCreated = false;
    let server = await prisma.server.findUnique({
      where: { slug: DUMMY_SERVER_SLUG },
    });

    if (!server) {
      server = await prisma.server.create({
        data: {
          name: "Dummy Local Server",
          slug: DUMMY_SERVER_SLUG,
          hostname: "localhost",
          public_ip: "127.0.0.1",
          private_ip: "127.0.0.1",
          location: ServerLocation.ASIA_PACIFIC,
          region_code: "local",
          max_shops: 1000,
          current_shop_count: 0,
          priority: 1,
          is_accepting_shops: true,
          is_default_for_location: true,
          status: ColumnGenericStatus.ACTIVE,
          health_status: ServerHealthStatus.HEALTHY,
          environment: ServerEnvironment.DEVELOPMENT,
          provider: ServerProvider.CUSTOM,
          notes: "Seeded public server",
        },
      });
      serverCreated = true;
    }

    let shopCreated = false;
    let shop = await prisma.shop.findUnique({
      where: { identity: DUMMY_SHOP_IDENTITY },
    });

    if (!shop) {
      const db_schema_name = schemaNameFromIdentity(DUMMY_SHOP_IDENTITY);

      shop = await prisma.shop.create({
        data: {
          tenant_id: tenant.id,
          shop_name: "Dummy Shop",
          identity: DUMMY_SHOP_IDENTITY,
          description: "Dummy shop created by seed for development and testing",
          status: ColumnGenericStatus.ACTIVE,
          server_id: server.id,
          database_id: database.id,
          db_schema_name,
        },
      });
      shopCreated = true;

      await prisma.server.update({
        where: { id: server.id },
        data: { current_shop_count: { increment: 1 } },
      });

      await prisma.database.update({
        where: { id: database.id },
        data: { current_schema_count: { increment: 1 } },
      });
    }

    if (shop.active_subscription_id) {
      const details = [
        shopCreated ? "shop created" : "shop already exists",
        serverCreated ? "server created" : "server already exists",
        "subscription already linked",
      ].join(", ");

      Logger.app.info(`⏭️  Stage skip: Subscription — ${details}`);
      return;
    }

    const existingSubscription = await prisma.shopSubscription.findFirst({
      where: {
        shop_id: shop.id,
        deleted_at: null,
        status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIALING] },
      },
      orderBy: { created_at: "desc" },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    let subscription = existingSubscription;

    if (!subscription) {
      subscription = await prisma.shopSubscription.create({
        data: {
          shop_id: shop.id,
          plan_id: plan.id,
          status: SubscriptionStatus.ACTIVE,
          billing_interval: BillingInterval.MONTHLY,
          current_period_start: now,
          current_period_end: periodEnd,
        },
      });
    }

    await prisma.shop.update({
      where: { id: shop.id },
      data: { active_subscription_id: subscription.id },
    });

    const details = [
      shopCreated ? "shop created" : "shop already exists",
      serverCreated ? "server created" : "server already exists",
      existingSubscription ? "linked existing subscription" : "subscription created and linked",
      `plan=${plan.slug}`,
      `identity=${DUMMY_SHOP_IDENTITY}`,
      `db_schema=${shop.db_schema_name}`,
    ].join(", ");

    Logger.app.info(`✅ Stage complete: Subscription — ${details}`);
  } catch (error) {
    Logger.app.error("❌ Subscription seeding failed", error);
    throw error;
  }
};
