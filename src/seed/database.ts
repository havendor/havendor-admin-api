import { Logger } from "@havendor/server-core";
import {
  ColumnGenericStatus,
  DatabaseProvider,
  DatabaseSslMode,
  ServerEnvironment,
  ServerHealthStatus,
  ServerLocation,
} from "../generated/prisma/index.js";
import { encryptSecret } from "../utility/field-crypto.js";
import { prisma } from "../utility/prisma.js";

export const DUMMY_DATABASE_SLUG = "dummy-local-db";

/** Fixed local seed password (encrypted at rest). Not for production use. */
const DUMMY_DB_PASSWORD = "dummy_shop_db_password";

export const seedDatabase = async () => {
  try {
    const existing = await prisma.database.findUnique({
      where: { slug: DUMMY_DATABASE_SLUG },
    });

    if (existing) {
      Logger.app.info(`⏭️  Stage skip: Database — already exists (slug=${DUMMY_DATABASE_SLUG})`);
      return existing;
    }

    const password_encrypted = encryptSecret(DUMMY_DB_PASSWORD);

    const database = await prisma.database.create({
      data: {
        name: "Dummy Local Database",
        slug: DUMMY_DATABASE_SLUG,
        hostname: "localhost",
        provider: DatabaseProvider.SELF_HOSTED,
        environment: ServerEnvironment.DEVELOPMENT,
        location: ServerLocation.ASIA_PACIFIC,
        region_code: "local",
        host: "127.0.0.1",
        port: 5432,
        db_name: "havendor_shops",
        username: "havendor",
        password_encrypted,
        ssl_mode: DatabaseSslMode.DISABLE,
        max_schemas: 1000,
        current_schema_count: 0,
        priority: 1,
        is_accepting_schemas: true,
        is_default: true,
        status: ColumnGenericStatus.ACTIVE,
        health_status: ServerHealthStatus.HEALTHY,
        notes: "Seeded shared shop Postgres host (schema-per-tenant)",
      },
    });

    Logger.app.info(
      `✅ Stage complete: Database — created slug=${DUMMY_DATABASE_SLUG} id=${database.id}`,
    );
    return database;
  } catch (error) {
    Logger.app.error("❌ Database seeding failed", error);
    throw error;
  }
};
