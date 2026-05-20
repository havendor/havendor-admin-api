import { Router } from "express";
import { AdminRoute } from "../modules/admin/admin/admin.route.js";
import { AuthRoutes } from "../modules/admin/auth/auth.route.js";
import { RoleRoute } from "../modules/admin/role/role.route.js";
import { routeRateConfig } from "../utility/index.js";

const router: Router = Router();

const routes: { path: string; route: Router }[] = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/admin",
    route: AdminRoute,
  },
  {
    path: "/role",
    route: RoleRoute,
  },
];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
