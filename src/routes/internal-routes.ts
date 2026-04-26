import { Router } from "express";
import { routeRateConfig } from "../utility";

const router: Router = Router();

const routes: { path: string; route: Router }[] = [];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
