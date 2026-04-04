import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

if (process.env.NODE_ENV === "production" || process.env.CI === "true") {
  process.exit(0);
}

const husky = (await import("husky")).default;
husky();
