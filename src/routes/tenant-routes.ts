import { Router } from "express";
import { TenantAuthRoutes } from "../modules/tenant/auth/tenantAuth.route.js";
import { routeRateConfig } from "../utility/index.js";

const router: Router = Router();

const routes: { path: string; route: Router }[] = [
  {
    path: "/auth",
    route: TenantAuthRoutes,
  },
];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
