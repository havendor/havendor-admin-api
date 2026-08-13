import { Logger } from "@havendor/server-core";
import bcrypt from "bcryptjs";
import { PERMISSIONS } from "../const/permissions.js";
import { prisma } from "../utility/prisma.js";
import { seedDatabase } from "./database.js";
import { seedPaymentMethods } from "./payment-method.js";
import { seedPlans } from "./plan.js";
import { seedSubscription } from "./subscription.js";

export const DUMMY_TENANT_EMAIL = "dummy_tenant@havendor.com";
const SYSTEM_ADMIN_EMAIL = "havendor24@gmail.com";

const logStageStart = (stage: string) => {
  Logger.app.info(`⏳ Stage: ${stage}...`);
};

const logStageComplete = (stage: string, detail?: string) => {
  Logger.app.info(
    detail ? `✅ Stage complete: ${stage} — ${detail}` : `✅ Stage complete: ${stage}`,
  );
};

const logStageSkip = (stage: string, reason: string) => {
  Logger.app.info(`⏭️  Stage skip: ${stage} — ${reason}`);
};

export const seedAdminPermissions = async () => {
  Logger.app.info("🌱 Seeding permissions and admin...");
  try {
    // 1. Seed Permission Groups and Permissions
    logStageStart("Permissions");
    let permissionsCreated = 0;
    let permissionsSkipped = 0;
    let groupsCreated = 0;
    let groupsSkipped = 0;

    for (const [groupKey, groupPermissions] of Object.entries(PERMISSIONS)) {
      const existingGroup = await prisma.permissionGroup.findUnique({
        where: { id: groupKey },
      });

      if (existingGroup) {
        groupsSkipped += 1;
      } else {
        await prisma.permissionGroup.create({
          data: {
            id: groupKey,
            name: groupKey
              .toLowerCase()
              .split("_")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
          },
        });
        groupsCreated += 1;
      }

      for (const permissionValue of Object.values(groupPermissions)) {
        const permissionId = permissionValue as string;
        const existingPermission = await prisma.permission.findUnique({
          where: { id: permissionId },
        });

        if (existingPermission) {
          if (existingPermission.group_id !== groupKey) {
            await prisma.permission.update({
              where: { id: permissionId },
              data: { group_id: groupKey },
            });
          }
          permissionsSkipped += 1;
        } else {
          await prisma.permission.create({
            data: {
              id: permissionId,
              name: permissionId
                .replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" "),
              group_id: groupKey,
            },
          });
          permissionsCreated += 1;
        }
      }
    }

    if (permissionsCreated === 0 && groupsCreated === 0) {
      logStageSkip(
        "Permissions",
        `all groups and permissions already exist (groups: ${groupsSkipped}, permissions: ${permissionsSkipped})`,
      );
    } else {
      logStageComplete(
        "Permissions",
        `${permissionsCreated} permission(s) created, ${permissionsSkipped} permission(s) skipped, ${groupsCreated} group(s) created, ${groupsSkipped} group(s) skipped`,
      );
    }

    // 2. Create/Update Super Admin Role
    logStageStart("Super Admin Role");
    let superAdminRole = await prisma.role.findFirst({
      where: { is_system: true },
    });

    if (superAdminRole) {
      logStageSkip("Super Admin Role", "system role already exists");
    } else {
      superAdminRole = await prisma.role.create({
        data: {
          name: "SUPER ADMIN",
          description: "Full system access with all permissions",
          is_system: true,
        },
      });
      logStageComplete("Super Admin Role", "system role created");
    }

    // 3. Link all permissions to Super Admin Role
    logStageStart("Super Admin Role Permissions");
    const allPermissions = await prisma.permission.findMany();
    let rolePermissionsCreated = 0;
    let rolePermissionsSkipped = 0;

    for (const perm of allPermissions) {
      const existingLink = await prisma.rolePermission.findUnique({
        where: {
          role_id_permission_id: {
            role_id: superAdminRole.id,
            permission_id: perm.id,
          },
        },
      });

      if (existingLink) {
        rolePermissionsSkipped += 1;
        continue;
      }

      await prisma.rolePermission.create({
        data: {
          role_id: superAdminRole.id,
          permission_id: perm.id,
        },
      });
      rolePermissionsCreated += 1;
    }

    if (rolePermissionsCreated === 0) {
      logStageSkip(
        "Super Admin Role Permissions",
        `all permission links already exist (${rolePermissionsSkipped} skipped)`,
      );
    } else {
      logStageComplete(
        "Super Admin Role Permissions",
        `${rolePermissionsCreated} link(s) created, ${rolePermissionsSkipped} skipped`,
      );
    }

    // 4. Ensure system addresses exist
    logStageStart("Addresses");
    let addressesCreated = 0;
    let addressesSkipped = 0;

    const addressSeeds = [
      {
        id: "system-default-address",
        address_name: "Default System Address",
        address_line_1: "Havendor HQ",
        city: "Dhaka",
        country: "Bangladesh",
      },
      {
        id: "dummy-admin-address",
        address_name: "Dummy Admin Address",
        address_line_1: "dummy-admin-address",
        city: "Dhaka",
        country: "Bangladesh",
      },
      {
        id: "dummy-tenant-address",
        address_name: "Dummy Tenant Address",
        address_line_1: "dummy-tenant-address",
        city: "Dhaka",
        country: "Bangladesh",
      },
    ] as const;

    for (const address of addressSeeds) {
      const existing = await prisma.address.findUnique({ where: { id: address.id } });
      if (existing) {
        addressesSkipped += 1;
        continue;
      }

      await prisma.address.create({ data: { ...address } });
      addressesCreated += 1;
    }

    const systemAddress = await prisma.address.findUniqueOrThrow({
      where: { id: "system-default-address" },
    });
    const dummyAdminAddress = await prisma.address.findUniqueOrThrow({
      where: { id: "dummy-admin-address" },
    });
    const dummyTenantAddress = await prisma.address.findUniqueOrThrow({
      where: { id: "dummy-tenant-address" },
    });

    if (addressesCreated === 0) {
      logStageSkip("Addresses", `all addresses already exist (${addressesSkipped} skipped)`);
    } else {
      logStageComplete(
        "Addresses",
        `${addressesCreated} address(es) created, ${addressesSkipped} skipped`,
      );
    }

    const password = "StrongPassword@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Ensure Super Admin User exists
    logStageStart("Super Admin User");
    const existingSuperAdmin = await prisma.admin.findUnique({
      where: { email: SYSTEM_ADMIN_EMAIL },
    });

    await prisma.admin.upsert({
      where: { email: SYSTEM_ADMIN_EMAIL },
      update: {
        role_id: superAdminRole.id,
      },
      create: {
        employee_id: "0001",
        first_name: "Super",
        last_name: "Admin",
        email: SYSTEM_ADMIN_EMAIL,
        password: hashedPassword,
        present_address_id: systemAddress.id,
        permanent_address_id: systemAddress.id,
        role_id: superAdminRole.id,
        is_system: true,
        status: "NEEDS_PASSWORD_CHANGE",
      },
    });

    if (existingSuperAdmin) {
      logStageSkip("Super Admin User", `${SYSTEM_ADMIN_EMAIL} already exists`);
    } else {
      logStageComplete("Super Admin User", `${SYSTEM_ADMIN_EMAIL} created`);
    }

    // 6. Ensure Dummy admin
    logStageStart("Dummy Admin User");
    const existingDummyAdmin = await prisma.admin.findUnique({
      where: { email: "dummy_admin@havendor.com" },
    });

    await prisma.admin.upsert({
      where: { email: "dummy_admin@havendor.com" },
      update: {
        role_id: superAdminRole.id,
      },
      create: {
        employee_id: "0002",
        first_name: "Dummy",
        last_name: "Admin",
        email: "dummy_admin@havendor.com",
        password: hashedPassword,
        present_address_id: dummyAdminAddress.id,
        permanent_address_id: dummyAdminAddress.id,
        role_id: superAdminRole.id,
        is_system: true,
        is_dummy: true,
        status: "ACTIVE",
      },
    });

    if (existingDummyAdmin) {
      logStageSkip("Dummy Admin User", "dummy_admin@havendor.com already exists");
    } else {
      logStageComplete("Dummy Admin User", "dummy_admin@havendor.com created");
    }

    // 7. Ensure Dummy tenant
    logStageStart("Dummy Tenant");
    const existingDummyTenant = await prisma.tenant.findUnique({
      where: { email: "dummy_tenant@havendor.com" },
    });

    await prisma.tenant.upsert({
      where: { email: "dummy_tenant@havendor.com" },
      update: {},
      create: {
        first_name: "Dummy",
        last_name: "Tenant",
        email: "dummy_tenant@havendor.com",
        password: hashedPassword,
        present_address_id: dummyTenantAddress.id,
        permanent_address_id: dummyTenantAddress.id,
        status: "ACTIVE",
        is_dummy: true,
        mobile: "+8801789699367",
      },
    });

    if (existingDummyTenant) {
      logStageSkip("Dummy Tenant", "dummy_tenant@havendor.com already exists");
    } else {
      logStageComplete("Dummy Tenant", "dummy_tenant@havendor.com created");
    }

    // 8. Plans
    logStageStart("Plans");
    await seedPlans();

    // 9. Payment methods
    logStageStart("Payment Methods");
    await seedPaymentMethods();

    // 10. Shared shop database host (schema-per-tenant)
    logStageStart("Database");
    await seedDatabase();

    // 11. Subscription (dummy shop + active subscription)
    logStageStart("Subscription");
    await seedSubscription();

    Logger.app.info("✔️ Seeding completed successfully");
  } catch (error) {
    Logger.app.error("❌ Seeding failed", error);
    throw error;
  }
};
