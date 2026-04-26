import { coreAppConfigZodSchema } from "@havendor/server-core";
import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envVarsZodSchema = z.object({
  CORS_ALLOWED_ORIGINS: z.string().default(`["http://localhost:3001"]`),
  DATABASE_URL: z.url({ error: "DATABASE_URL is required" }),
});

const envVars = z.intersection(envVarsZodSchema, coreAppConfigZodSchema).parse(process.env);

const appConfig = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  CORS_ALLOWED_ORIGINS: JSON.parse(envVars.CORS_ALLOWED_ORIGINS),
  REFRESH_TOKEN_NAME: envVars.NODE_ENV === "production" ? "__Host-refresh_token" : "refresh_token",
  PATH_PREFIX: "/api-server",
  DATABASE_URL: envVars.DATABASE_URL,
  ENCRYPTION_KEY: envVars.ENCRYPTION_KEY,
  HASH_PEPPER: envVars.HASH_PEPPER,
  REDIS_URL: envVars.REDIS_URL,
  SERVICE_NAME: envVars.SERVICE_NAME,
  ENABLE_FILE_LOGGING: envVars.ENABLE_FILE_LOGGING,
  INTERNAL_SERVICE_SECRET: envVars.INTERNAL_SERVICE_SECRET,
} as const;

export default appConfig;
