import { envVars as coreAppEnvVars } from "@havendor/server-core";
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
  EMAIL_DOMAIN: z.string({ error: "EMAIL_DOMAIN is required" }),
  S3_PRIVATE_BUCKET: z.string({ error: "S3_PRIVATE_BUCKET is required" }),
  STAGING_FRONTEND_URL: z.url({ error: "STAGING_FRONTEND_URL is required" }),
  STRIPE_SECRET_KEY: z.string().optional().default(""),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default(""),
  STRIPE_PUBLISHABLE_KEY: z.string().optional().default(""),
  SSLCOMMERZ_STORE_ID: z.string().optional().default(""),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional().default(""),
  SSLCOMMERZ_IS_LIVE: z
    .string()
    .optional()
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  TENANT_FRONTEND_URL: z.string().optional().default("http://localhost:3000"),
  PUBLIC_API_BASE_URL: z.string().optional().default("http://localhost:5000"),
  INTERNAL_ALLOWED_IPS: z
    .string()
    .optional()
    .default('["127.0.0.1","::1","::ffff:127.0.0.1"]')
    .transform((val) => {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? parsed.map(String) : [String(val)];
      } catch {
        return val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }),
  INTERNAL_API_KEY: z.string().optional().default(""),
});

const parsedCoreVars = coreAppEnvVars;
const parsedAppVars = envVarsZodSchema.parse(process.env);

const envVars = { ...parsedCoreVars, ...parsedAppVars };

export const APP_CONFIG = {
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
  REDIS_CACHE_URL: envVars.REDIS_CACHE_URL,
  REDIS_RATE_LIMIT_URL: envVars.REDIS_RATE_LIMIT_URL,
  REDIS_QUEUE_URL: envVars.REDIS_QUEUE_URL,
  SERVICE_NAME: envVars.SERVICE_NAME,
  ENABLE_FILE_LOGGING: envVars.ENABLE_FILE_LOGGING,
  INTERNAL_SERVICE_SECRET: envVars.INTERNAL_SERVICE_SECRET,
  INTERNAL_SECURITY: {
    allowed_ips: envVars.INTERNAL_ALLOWED_IPS,
    api_key: envVars.INTERNAL_API_KEY || envVars.INTERNAL_SERVICE_SECRET || "",
  },
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
  EMAIL_DOMAIN: envVars.EMAIL_DOMAIN,
  S3: {
    PRIVATE_BUCKET: envVars.S3_PRIVATE_BUCKET,
    DEFAULT_BUCKET: envVars.S3_DEFAULT_BUCKET,
  },
  STAGING_FRONTEND_URL: envVars.STAGING_FRONTEND_URL,
  TENANT_FRONTEND_URL: envVars.TENANT_FRONTEND_URL,
  PUBLIC_API_BASE_URL: envVars.PUBLIC_API_BASE_URL,
  STRIPE: {
    secret_key: envVars.STRIPE_SECRET_KEY,
    webhook_secret: envVars.STRIPE_WEBHOOK_SECRET,
    publishable_key: envVars.STRIPE_PUBLISHABLE_KEY,
  },
  SSLCOMMERZ: {
    store_id: envVars.SSLCOMMERZ_STORE_ID,
    store_password: envVars.SSLCOMMERZ_STORE_PASSWORD,
    is_live: envVars.SSLCOMMERZ_IS_LIVE,
  },
} as const;
