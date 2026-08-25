import { ApiError, Logger } from "@havendor/server-core";
import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { APP_CONFIG } from "../config/index.js";

/**
 * Normalizes an IP string (handles IPv6-mapped IPv4, port suffixes, whitespace)
 */
const normalizeIp = (rawIp: string): string => {
  if (!rawIp) return "";
  let ip = rawIp.trim();

  // If port is attached e.g. "127.0.0.1:4532"
  if (ip.includes(":") && !ip.includes("::") && ip.split(":").length === 2) {
    ip = ip.split(":")[0]!;
  }

  // IPv4-mapped IPv6 e.g. "::ffff:127.0.0.1" -> "127.0.0.1"
  if (ip.startsWith("::ffff:")) {
    ip = ip.slice(7);
  }

  return ip;
};

/**
 * Extracts client IP from request headers and socket
 */
export const extractClientIp = (req: Request): string => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return normalizeIp(first);
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return normalizeIp(forwarded[0]);
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return normalizeIp(realIp);
  }

  const remote = req.socket?.remoteAddress || req.ip || "";
  return normalizeIp(remote);
};

/**
 * Checks if an IPv4 address is within a CIDR subnet
 */
const isIpInCidr = (ip: string, cidr: string): boolean => {
  if (!cidr.includes("/")) return ip === cidr;

  const [range, bitsStr] = cidr.split("/");
  if (!range || !bitsStr) return false;

  const bits = parseInt(bitsStr, 10);
  if (isNaN(bits) || bits < 0 || bits > 32) return false;

  const ipNum = ipToLong(ip);
  const rangeNum = ipToLong(range);
  if (ipNum === null || rangeNum === null) return false;

  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipNum & mask) === (rangeNum & mask);
};

const ipToLong = (ip: string): number | null => {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return null;
  }
  return ((parts[0]! << 24) | (parts[1]! << 16) | (parts[2]! << 8) | parts[3]!) >>> 0;
};

/**
 * Checks if client IP is permitted according to configured whitelist
 */
const isIpAllowed = (clientIp: string, allowedIps: readonly string[]): boolean => {
  if (!clientIp) return false;

  for (const allowed of allowedIps) {
    const target = normalizeIp(allowed);
    if (!target) continue;

    if (target === "*") return true;

    // Exact matches
    if (clientIp === target) return true;

    // Localhost aliases
    if (
      (clientIp === "127.0.0.1" || clientIp === "::1" || clientIp === "localhost") &&
      (target === "127.0.0.1" || target === "::1" || target === "localhost")
    ) {
      return true;
    }

    // CIDR match (for IPv4 subnets like 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
    if (target.includes("/") && isIpInCidr(clientIp, target)) {
      return true;
    }
  }

  return false;
};

/**
 * Extracts and validates internal secret from request headers
 */
const isSecretValid = (req: Request, expectedSecret: string): boolean => {
  if (!expectedSecret) return false;

  const headerSecret =
    req.headers["x-internal-secret"] || req.headers["x-internal-key"] || req.headers["x-api-key"];

  if (typeof headerSecret === "string" && headerSecret.trim() === expectedSecret) {
    return true;
  }

  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string") {
    const [scheme, token] = authHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && token?.trim() === expectedSecret) {
      return true;
    }
  }

  return false;
};

export type TInternalSecurityGuardOptions = {
  /**
   * If true, secret check is strictly required regardless of IP whitelist.
   * Default: false (allowed if client IP is in whitelist OR valid secret is provided).
   */
  require_secret?: boolean;
};

/**
 * Guard middleware for internal microservice-to-microservice APIs.
 * Validates request origin against allowed IP whitelist and/or shared internal secret.
 */
export const internalSecurityGuard =
  (options: TInternalSecurityGuardOptions = {}) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const clientIp = extractClientIp(req);
    const allowedIps = APP_CONFIG.INTERNAL_SECURITY.allowed_ips;
    const expectedSecret = APP_CONFIG.INTERNAL_SECURITY.api_key;

    const ipMatch = isIpAllowed(clientIp, allowedIps);
    const secretMatch = isSecretValid(req, expectedSecret);

    if (options.require_secret) {
      if (!secretMatch) {
        Logger.app.warn(
          `⛔ [InternalSecurityGuard] Access rejected: Missing or invalid secret from IP: ${clientIp} for ${req.method} ${req.originalUrl}`,
        );
        throw new ApiError(
          httpStatus.FORBIDDEN,
          "Forbidden: Valid internal secret is required for this endpoint.",
        );
      }
    } else {
      // Allowed if IP is whitelisted OR secret is valid
      if (!ipMatch && !secretMatch) {
        Logger.app.warn(
          `⛔ [InternalSecurityGuard] Access rejected: IP ${clientIp} is not in allowed IP list [${allowedIps.join(", ")}] and no valid secret was provided for ${req.method} ${req.originalUrl}`,
        );
        throw new ApiError(
          httpStatus.FORBIDDEN,
          `Forbidden: IP address (${clientIp || "unknown"}) is not authorized for internal API access.`,
        );
      }
    }

    // Attach verified internal metadata for downstream controllers
    (req as Request & { internalClient?: { ip: string; isSecretAuth: boolean } }).internalClient = {
      ip: clientIp,
      isSecretAuth: secretMatch,
    };

    next();
  };
