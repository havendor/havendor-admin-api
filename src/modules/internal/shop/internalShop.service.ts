import { ApiError } from "@havendor/server-core";
import httpStatus from "http-status";
import { Prisma, ShopDomain, SubscriptionStatus } from "../../../generated/prisma/index.js";
import { decryptSecret, prisma } from "../../../utility/index.js";
import { EntitlementService } from "../../entitlement/entitlement.service.js";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Normalizes domain strings: trims protocol, ports, paths, and trailing dots
 */
const normalizeDomain = (domain: string): string => {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .replace(/:\d+$/, "")
    .replace(/\.+$/, "");
};

/**
 * Common Prisma include query for internal shop retrieval
 */
const shopInclude = {
  database: true,
  server: true,
  tenant: {
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      mobile: true,
      status: true,
    },
  },
  domains: {
    where: { deleted_at: null },
    orderBy: { is_primary: "desc" as const },
  },
  active_subscription: {
    include: {
      plan: {
        include: {
          plan_features: {
            include: { feature: true },
          },
        },
      },
    },
  },
  shop_addons: {
    where: { status: SubscriptionStatus.ACTIVE, deleted_at: null },
    include: {
      addon: {
        include: {
          addon_features: {
            include: { feature: true },
          },
        },
      },
    },
  },
};

/**
 * Builds formatted connection URI and decrypts DB credentials
 */
const formatDatabase = (
  db: {
    id: string;
    name: string;
    slug: string;
    provider: string;
    host: string;
    port: number;
    db_name: string;
    username: string;
    password_encrypted: string;
    ssl_mode: string;
  },
  db_schema_name: string,
) => {
  let password: string;
  try {
    password = decryptSecret(db.password_encrypted);
  } catch {
    password = "";
  }

  const sslModeParam = db.ssl_mode.toLowerCase();
  const connectionUri = `postgresql://${encodeURIComponent(db.username)}:${encodeURIComponent(password)}@${db.host}:${db.port}/${db.db_name}?schema=${db_schema_name}&sslmode=${sslModeParam}`;

  return {
    id: db.id,
    name: db.name,
    slug: db.slug,
    provider: db.provider,
    host: db.host,
    port: db.port,
    db_name: db.db_name,
    username: db.username,
    password,
    db_schema_name,
    ssl_mode: db.ssl_mode,
    connection_uri: connectionUri,
  };
};

type TShopPayload = Prisma.ShopGetPayload<{ include: typeof shopInclude }>;

/**
 * Formats full response object with shop, database, subscription, and entitlements
 */
const formatShopResponse = async (shop: TShopPayload, matchedDomain?: ShopDomain | null) => {
  const entitlements = await EntitlementService.getAll(shop.id);
  const database = formatDatabase(shop.database, shop.db_schema_name);

  return {
    shop: {
      id: shop.id,
      tenant_id: shop.tenant_id,
      shop_name: shop.shop_name,
      identity: shop.identity,
      description: shop.description,
      status: shop.status,
      status_by_admin: shop.status_by_admin,
      db_schema_name: shop.db_schema_name,
      db_status: shop.db_status,
      is_migration_completed: shop.is_migration_completed,
      last_migration_name: shop.last_migration_name,
      last_migration_at: shop.last_migration_at,
      is_last_migration_success: shop.is_last_migration_success,
      is_user_seeded: shop.is_user_seeded,
      created_at: shop.created_at,
      updated_at: shop.updated_at,
      tenant: shop.tenant,
    },
    matched_domain: matchedDomain
      ? {
          id: matchedDomain.id,
          domain: matchedDomain.domain,
          type: matchedDomain.type,
          is_primary: matchedDomain.is_primary,
          status: matchedDomain.status,
          ssl_status: matchedDomain.ssl_status,
          ssl_enabled: matchedDomain.ssl_enabled,
        }
      : null,
    domains: (shop.domains || []).map((d) => ({
      id: d.id,
      domain: d.domain,
      type: d.type,
      is_primary: d.is_primary,
      status: d.status,
      ssl_status: d.ssl_status,
      ssl_enabled: d.ssl_enabled,
    })),
    database,
    server: shop.server
      ? {
          id: shop.server.id,
          name: shop.server.name,
          slug: shop.server.slug,
          public_ip: shop.server.public_ip,
          private_ip: shop.server.private_ip,
          location: shop.server.location,
          status: shop.server.status,
        }
      : null,
    subscription: shop.active_subscription
      ? {
          id: shop.active_subscription.id,
          status: shop.active_subscription.status,
          billing_interval: shop.active_subscription.billing_interval,
          current_period_start: shop.active_subscription.current_period_start,
          current_period_end: shop.active_subscription.current_period_end,
          trial_ends_at: shop.active_subscription.trial_ends_at,
          canceled_at: shop.active_subscription.canceled_at,
          is_account_over_limit: shop.active_subscription.is_account_over_limit,
          plan: {
            id: shop.active_subscription.plan.id,
            slug: shop.active_subscription.plan.slug,
            name: shop.active_subscription.plan.name,
            description: shop.active_subscription.plan.description,
            price_monthly: shop.active_subscription.plan.price_monthly,
            price_yearly: shop.active_subscription.plan.price_yearly,
            features: (shop.active_subscription.plan.plan_features || []).map((pf) => ({
              key: pf.feature.key,
              name: pf.feature.name,
              description: pf.feature.description,
              type: pf.feature.type,
              enabled: pf.enabled,
              limit_value: pf.limit_value == null ? null : pf.limit_value.toString(),
            })),
          },
        }
      : null,
    active_addons: (shop.shop_addons || []).map((sa) => ({
      id: sa.id,
      status: sa.status,
      billing_interval: sa.billing_interval,
      current_period_start: sa.current_period_start,
      current_period_end: sa.current_period_end,
      addon: {
        id: sa.addon.id,
        slug: sa.addon.slug,
        name: sa.addon.name,
        description: sa.addon.description,
        features: (sa.addon.addon_features || []).map((af) => ({
          key: af.feature.key,
          name: af.feature.name,
          type: af.feature.type,
          enabled: af.enabled,
          limit_value: af.limit_value == null ? null : af.limit_value.toString(),
        })),
      },
    })),
    entitlements,
  };
};

/**
 * Resolves shop by domain (from ShopDomain table or identity subdomain match)
 */
const resolveByDomain = async (rawDomain: string) => {
  const domain = normalizeDomain(rawDomain);
  if (!domain) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid domain provided");
  }

  // 1. Look up in ShopDomain table
  const domainRecord = await prisma.shopDomain.findFirst({
    where: {
      domain,
      deleted_at: null,
    },
    include: {
      shop: {
        include: shopInclude,
      },
    },
  });

  if (domainRecord && domainRecord.shop && !domainRecord.shop.deleted_at) {
    return formatShopResponse(domainRecord.shop, domainRecord);
  }

  // 2. Check if the domain is formatted as an identity prefix (e.g. S00000001 or s00000001.havendor.com)
  const identityCandidate = domain.split(".")[0]?.toUpperCase();
  if (identityCandidate) {
    const shopByIdentity = await prisma.shop.findFirst({
      where: {
        identity: identityCandidate,
        deleted_at: null,
      },
      include: shopInclude,
    });

    if (shopByIdentity) {
      return formatShopResponse(shopByIdentity);
    }
  }

  throw new ApiError(
    httpStatus.NOT_FOUND,
    `Shop not found for domain: ${domain}`,
    "Shop domain resolution failed",
  );
};

/**
 * Resolves shop by UUID ID or Identity string (e.g. S00000001)
 */
const getByIdOrIdentity = async (idOrIdentity: string) => {
  const isUuid = UUID_REGEX.test(idOrIdentity);

  const shop = await prisma.shop.findFirst({
    where: {
      ...(isUuid ? { id: idOrIdentity } : { identity: idOrIdentity.toUpperCase() }),
      deleted_at: null,
    },
    include: shopInclude,
  });

  if (!shop) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      `Shop not found for identifier: ${idOrIdentity}`,
      "Shop not found",
    );
  }

  return formatShopResponse(shop);
};

/**
 * Internal helper to find shop entity by either ID, Identity or Domain
 */
const resolveShopEntity = async (param: string) => {
  const cleanParam = normalizeDomain(param);
  const isUuid = UUID_REGEX.test(param);

  if (isUuid) {
    const shop = await prisma.shop.findFirst({
      where: { id: param, deleted_at: null },
      include: shopInclude,
    });
    if (shop) return shop;
  }

  // Identity match
  const shopByIdentity = await prisma.shop.findFirst({
    where: { identity: param.toUpperCase(), deleted_at: null },
    include: shopInclude,
  });
  if (shopByIdentity) return shopByIdentity;

  // Domain match
  const domainRecord = await prisma.shopDomain.findFirst({
    where: { domain: cleanParam, deleted_at: null },
    include: { shop: { include: shopInclude } },
  });
  if (domainRecord?.shop && !domainRecord.shop.deleted_at) {
    return domainRecord.shop;
  }

  throw new ApiError(httpStatus.NOT_FOUND, `Shop not found for: ${param}`);
};

/**
 * Dedicated database info endpoint
 */
const getDatabaseInfo = async (idOrDomain: string) => {
  const shop = await resolveShopEntity(idOrDomain);
  const database = formatDatabase(shop.database, shop.db_schema_name);

  return {
    shop_id: shop.id,
    identity: shop.identity,
    shop_name: shop.shop_name,
    db_schema_name: shop.db_schema_name,
    db_status: shop.db_status,
    is_migration_completed: shop.is_migration_completed,
    last_migration_name: shop.last_migration_name,
    database,
  };
};

/**
 * Dedicated subscription & plan info endpoint
 */
const getSubscriptionInfo = async (idOrDomain: string) => {
  const full = await (UUID_REGEX.test(idOrDomain)
    ? getByIdOrIdentity(idOrDomain)
    : resolveByDomain(idOrDomain));

  return {
    shop_id: full.shop.id,
    identity: full.shop.identity,
    shop_name: full.shop.shop_name,
    status: full.shop.status,
    subscription: full.subscription,
    active_addons: full.active_addons,
    entitlements: full.entitlements,
  };
};

/**
 * Dedicated entitlements & resource limits endpoint
 */
const getEntitlements = async (idOrDomain: string) => {
  const shop = await resolveShopEntity(idOrDomain);
  const entitlements = await EntitlementService.getAll(shop.id);

  return {
    shop_id: shop.id,
    identity: shop.identity,
    shop_name: shop.shop_name,
    status: shop.status,
    entitlements,
  };
};

export const InternalShopService = {
  resolveByDomain,
  getByIdOrIdentity,
  getDatabaseInfo,
  getSubscriptionInfo,
  getEntitlements,
};
