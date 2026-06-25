import { Logger } from "@havendor/server-core";
import bcrypt from "bcryptjs";
import { PERMISSIONS } from "../const/permissions.js";
import { prisma } from "../utility/prisma.js";

export const seedAdminPermissions = async () => {
  Logger.app.info("🌱 Seeding permissions and admin...");
  try {
    // 1. Seed Permission Groups and Permissions
    for (const [groupKey, groupPermissions] of Object.entries(PERMISSIONS)) {
      // Upsert Group
      await prisma.permissionGroup.upsert({
        where: { id: groupKey },
        update: {},
        create: {
          id: groupKey,
          name: groupKey
            .toLowerCase()
            .split("_")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
        },
      });

      // Upsert Permissions for this group
      for (const permissionValue of Object.values(groupPermissions)) {
        await prisma.permission.upsert({
          where: { id: permissionValue as string },
          update: { group_id: groupKey },
          create: {
            id: permissionValue as string,
            name: (permissionValue as string)
              .replace(/_/g, " ")
              .split(" ")
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
            group_id: groupKey,
          },
        });
      }
    }

    // 2. Create/Update Super Admin Role
    const superAdminRole = await prisma.role.upsert({
      where: { name: "SUPER ADMIN" },
      update: { is_system: true },
      create: {
        name: "SUPER ADMIN",
        description: "Full system access with all permissions",
        is_system: true,
      },
    });

    // 3. Link all permissions to Super Admin Role
    const allPermissions = await prisma.permission.findMany();
    for (const perm of allPermissions) {
      await prisma.rolePermission.upsert({
        where: {
          role_id_permission_id: {
            role_id: superAdminRole.id,
            permission_id: perm.id,
          },
        },
        update: {},
        create: {
          role_id: superAdminRole.id,
          permission_id: perm.id,
        },
      });
    }

    // 4. Ensure a System Address exists for the Super Admin
    const systemAddress = await prisma.address.upsert({
      where: { id: "system-default-address" },
      update: {},
      create: {
        id: "system-default-address",
        address_name: "Default System Address",
        address_line_1: "Havendor HQ",
        city: "Dhaka",
        country: "Bangladesh",
      },
    });

    const password = "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Ensure Super Admin User exists
    await prisma.admin.upsert({
      where: { email: "admin@havendor.com" },
      update: {
        role_id: superAdminRole.id,
      },
      create: {
        employee_id: "0001",
        first_name: "Super",
        last_name: "Admin",
        email: "admin@havendor.com",
        password: hashedPassword, // Note: Should be hashed in a real scenario
        present_address_id: systemAddress.id,
        permanent_address_id: systemAddress.id,
        role_id: superAdminRole.id,
        is_system: true,
        status: "NEEDS_PASSWORD_CHANGE",
      },
    });

    Logger.app.info("✔️ Seeding completed successfully");
  } catch (error) {
    Logger.app.error("❌ Seeding failed", error);
    throw error;
  }
};
