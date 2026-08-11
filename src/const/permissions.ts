export const PERMISSIONS = {
  // ====================================
  // Admin
  // ====================================
  ADMIN: {
    CREATE: "create_admin",
    READ: "read_admin",
    UPDATE: "update_admin",
    RESET_PASSWORD: "reset_password_admin",
    DELETE: "delete_admin",
    TERMINATE: "terminate_admin",
    RESTORE: "restore_admin", // reactivate a terminated/deleted admin
  },

  // ====================================
  // Admin Session
  // ====================================
  ADMIN_SESSION: {
    READ: "read_admin_session",
    REVOKE: "revoke_admin_session", // force logout
  },

  // ====================================
  // Role
  // ====================================
  ROLE: {
    CREATE: "create_role",
    READ: "read_role",
    UPDATE: "update_role",
    DELETE: "delete_role",
    ASSIGN: "assign_role", // assign a role to an admin
  },

  // ====================================
  // Permission
  // ====================================
  PERMISSION: {
    READ: "read_permission",
    ASSIGN: "assign_permission", // assign permissions to a role
    REVOKE: "revoke_permission", // remove permissions from a role
  },

  // ====================================
  // Address
  // ====================================
  ADDRESS: {
    CREATE: "create_address",
    READ: "read_address",
    UPDATE: "update_address",
    DELETE: "delete_address",
  },

  // ====================================
  // Tenant
  // ====================================
  TENANT: {
    CREATE: "create_tenant",
    READ: "read_tenant",
    UPDATE: "update_tenant",
    DELETE: "delete_tenant",
    TERMINATE: "terminate_tenant",
    RESTORE: "restore_tenant",
  },

  // ====================================
  // Tenant Session
  // ====================================
  TENANT_SESSION: {
    READ: "read_tenant_session",
    REVOKE: "revoke_tenant_session",
  },

  // ====================================
  // Server (app / hosting nodes for shops)
  // ====================================
  SERVER: {
    CREATE: "create_server",
    READ: "read_server",
    UPDATE: "update_server",
    DELETE: "delete_server",
    DRAIN: "drain_server", // stop accepting new shops
    SET_DEFAULT: "set_default_server", // is_default_for_location
  },

  // ====================================
  // Database (shared Postgres hosts; schema-per-shop)
  // ====================================
  DATABASE: {
    CREATE: "create_database",
    READ: "read_database",
    UPDATE: "update_database",
    DELETE: "delete_database",
    DRAIN: "drain_database", // stop accepting new schemas
    SET_DEFAULT: "set_default_database", // is_default host pool
  },

  // ====================================
  // Shop
  // ====================================
  SHOP: {
    CREATE: "create_shop",
    READ: "read_shop",
    UPDATE: "update_shop",
    DELETE: "delete_shop",
    APPROVE: "approve_shop", // PENDING → ACTIVE
    SUSPEND: "suspend_shop", // ACTIVE → INACTIVE
    RESTORE: "restore_shop", // INACTIVE → ACTIVE
    MIGRATE_DB: "migrate_shop_db",
    SEED_DB: "seed_shop_db",
    MANAGE_DB: "manage_shop_db",
  },

  // ====================================
  // Shop Domain
  // ====================================
  SHOP_DOMAIN: {
    CREATE: "create_shop_domain",
    READ: "read_shop_domain",
    UPDATE: "update_shop_domain",
    DELETE: "delete_shop_domain",
    VERIFY: "verify_shop_domain", // trigger DNS verification
    SET_PRIMARY: "set_primary_shop_domain",
    MANAGE_SSL: "manage_ssl_shop_domain",
  },

  // ====================================
  // Plan (catalog pricing / limits)
  // ====================================
  PLAN: {
    CREATE: "create_plan",
    READ: "read_plan",
    UPDATE: "update_plan",
    DELETE: "delete_plan",
  },

  // ====================================
  // Payment
  // ====================================
  PAYMENT: {
    READ: "read_payment",
    VERIFY: "verify_payment",
    REJECT: "reject_payment",
  },

  // ====================================
  // Payment Method
  // ====================================
  PAYMENT_METHOD: {
    CREATE: "create_payment_method",
    READ: "read_payment_method",
    UPDATE: "update_payment_method",
    DELETE: "delete_payment_method",
  },

  // ====================================
  // Subscription (shop subscriptions)
  // ====================================
  SUBSCRIPTION: {
    READ: "read_subscription",
    BLOCK: "block_subscription",
    UNBLOCK: "unblock_subscription",
  },
} as const;

// ====================================
// Flat list — useful for seeding the
// Permission table in your database
// ====================================
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.values(group),
) as TPermission[];

// Type — useful for typed permission
// checks in middleware / guards
// ====================================
type DeepValue<T> = T extends object ? DeepValue<T[keyof T]> : T;

export type TPermission = DeepValue<typeof PERMISSIONS>;
