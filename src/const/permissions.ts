export const PERMISSIONS = {
  // ====================================
  // Admin
  // ====================================
  ADMIN: {
    CREATE: "create_admin",
    READ: "read_admin",
    UPDATE: "update_admin",
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
  // Permission Group
  // ====================================
  PERMISSION_GROUP: {
    CREATE: "create_permission_group",
    READ: "read_permission_group",
    UPDATE: "update_permission_group",
    DELETE: "delete_permission_group",
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
  // Shop Database
  // ====================================
  SHOP_DATABASE: {
    CREATE: "create_shop_database",
    READ: "read_shop_database",
    UPDATE: "update_shop_database",
    DELETE: "delete_shop_database",
  },
} as const;

// ====================================
// Flat list — useful for seeding the
// Permission table in your database
// ====================================
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).flatMap((group) =>
  Object.values(group),
) as Permission[];

// Type — useful for typed permission
// checks in middleware / guards
// ====================================
export type Permission =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS][keyof (typeof PERMISSIONS)[keyof typeof PERMISSIONS]];
