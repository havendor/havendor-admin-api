import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const envVarsZodSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  PORT: z
    .string({ error: "PORT is required" })
    .default("3005")
    .transform((val) => Number(val)),
  CORS_ALLOWED_ORIGINS: z.string().default(`["http://localhost:3001"]`),
  DATABASE_URL: z.string({ error: "DATABASE_URL is required" }),
  ENCRYPTION_KEY: z.string({ error: "ENCRYPTION_KEY is required" }),
  HASH_PEPPER: z.string({ error: "HASH_PEPPER is required" }),
  REDIS_URL: z.string({ error: "REDIS_URL is required" }),
  SERVICE_NAME: z.string({ error: "SERVICE_NAME is required" }),
  ENABLE_FILE_LOGGING: z
    .string()
    .default("true")
    .transform((val) => val === "true"),
});

const envVars = envVarsZodSchema.parse(process.env);

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
} as const;

export default appConfig;
