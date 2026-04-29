import { Logger } from "@havendor/server-core";
import { seedAdminPermissions } from "./seed/index.js";

const main = async () => {
  try {
    await seedAdminPermissions();
    process.exit(0);
  } catch (error) {
    Logger.app.error("❌ Seeding failed", error);
    process.exit(1);
  }
};

main();
