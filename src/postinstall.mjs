import dotenv from "dotenv";
dotenv.config();

if (process.env.NODE_ENV === "development") {
  process.exit(0);
}

const execSync = (await import("child_process")).execSync;
execSync("npx prisma generate", { stdio: "inherit" });
