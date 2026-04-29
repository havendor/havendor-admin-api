import { authRateLimit, internalRateLimit, publicRateLimit } from "@havendor/server-core";
import { RequestHandler } from "express";

export type RouteRateConfig = {
  match: (path: string) => boolean;
  limiter: RequestHandler;
};

const routeRateConfig: RouteRateConfig[] = [
  {
    match: (path: string) => path.includes("/auth"),
    limiter: authRateLimit,
  },
  {
    match: (path: string) => path.includes("/internal"),
    limiter: internalRateLimit,
  },
  {
    match: () => true,
    limiter: publicRateLimit,
  },
];

export { routeRateConfig };
