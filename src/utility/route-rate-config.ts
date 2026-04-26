import { authRateLimit, internalRateLimit, publicRateLimit } from "@havendor/server-core";

const routeRateConfig = [
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
