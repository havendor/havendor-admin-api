import { coreAppConfigZodSchema } from "@havendor/server-core";
import { z } from "zod";

const envVarsZodSchema = z.object({
  CORS_ALLOWED_ORIGINS: z.string().default(`["http://localhost:3001"]`),
  DATABASE_URL: z.url({ error: "DATABASE_URL is required" }),
  SMTP_USER: z.string({ error: "SMTP_USER is required" }),
  SMTP_PASS: z.string({ error: "SMTP_PASS is required" }),
  SMTP_PORT: z.string().default("465").transform(Number),
  SMTP_HOST: z.string().default("smtp.gmail.com"),
  JWT_SECRET: z.string({ error: "JWT_SECRET is required" }),
  JWT_ACCESS_EXPIRES: z.string().transform((value) => Number(value)),
  REFRESH_EXPIRES: z
    .string()
    .optional()
    .default("86400") // 1 day in seconds - 1*24*60*60
    .transform((value) => Number(value)),
  REMEMBER_ME_EXPIRES: z
    .string()
    .optional()
    .default("2592000") // 30 days in seconds - 30*24*60*60
    .transform((value) => Number(value)),
});

const envVars = z.intersection(envVarsZodSchema, coreAppConfigZodSchema).parse(process.env);

const appConfig = {
  NODE_ENV: envVars.NODE_ENV,
  PORT: envVars.PORT,
  CORS_ALLOWED_ORIGINS: JSON.parse(envVars.CORS_ALLOWED_ORIGINS),
  ADMIN_REFRESH_TOKEN_NAME:
    envVars.NODE_ENV === "production" ? "__Host-a_refresh_token" : "a_refresh_token",
  TENANT_REFRESH_TOKEN_NAME:
    envVars.NODE_ENV === "production" ? "__Host-t_refresh_token" : "t_refresh_token",
  PATH_PREFIX: "/api-server",
  DATABASE_URL: envVars.DATABASE_URL,
  ENCRYPTION_KEY: envVars.ENCRYPTION_KEY,
  HASH_PEPPER: envVars.HASH_PEPPER,
  REDIS_URL: envVars.REDIS_URL,
  SERVICE_NAME: envVars.SERVICE_NAME,
  ENABLE_FILE_LOGGING: envVars.ENABLE_FILE_LOGGING,
  INTERNAL_SERVICE_SECRET: envVars.INTERNAL_SERVICE_SECRET,
  SMTP: {
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
    port: envVars.SMTP_PORT,
    host: envVars.SMTP_HOST,
  },
  JWT: {
    secret: envVars.JWT_SECRET,
    access_expires: envVars.JWT_ACCESS_EXPIRES,
  },
  REFRESH_EXPIRES: envVars.REFRESH_EXPIRES,
  REMEMBER_ME_EXPIRES: envVars.REMEMBER_ME_EXPIRES,
} as const;

export default appConfig;
