import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import appConfig from "../config/appConfig.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended for GCM
const AUTH_TAG_LENGTH = 16;

const deriveKey = (secret: string): Buffer => {
  return createHash("sha256").update(secret, "utf8").digest();
};

/**
 * Encrypt a secret for storage (e.g. database passwords).
 * Format: base64(iv):base64(authTag):base64(ciphertext)
 */
export const encryptSecret = (plain: string): string => {
  const key = deriveKey(appConfig.ENCRYPTION_KEY);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

/**
 * Decrypt a payload produced by encryptSecret.
 */
export const decryptSecret = (payload: string): string => {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted secret format");
  }

  const [ivB64, tagB64, dataB64] = parts;
  const key = deriveKey(appConfig.ENCRYPTION_KEY);
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const ciphertext = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString("utf8");
};
