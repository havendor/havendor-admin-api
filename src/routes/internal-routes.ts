import { Router } from "express";
import { InternalHealthRoute } from "../modules/internal/health/internalHealth.route.js";
import { InternalShopRoute } from "../modules/internal/shop/internalShop.route.js";
import { routeRateConfig } from "../utility/index.js";

const router: Router = Router();

const routes: { path: string; route: Router }[] = [
  {
    path: "/shops",
    route: InternalShopRoute,
  },
  {
    path: "/health",
    route: InternalHealthRoute,
  },
];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
