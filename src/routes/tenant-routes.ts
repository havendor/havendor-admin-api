import { Router } from "express";
import { TenantAuthRoutes } from "../modules/tenant/auth/tenantAuth.route.js";
import { TenantPaymentRoute } from "../modules/tenant/payment/payment.route.js";
import { TenantAddonRoute } from "../modules/tenant/addon/addon.route.js";
import { TenantEntitlementRoute } from "../modules/tenant/entitlement/entitlement.route.js";
import { TenantPlanRoute } from "../modules/tenant/plan/plan.route.js";
import { TenantShopRoutes } from "../modules/tenant/shop/tenantShop.route.js";
import { routeRateConfig } from "../utility/index.js";

const router: Router = Router();

const routes: { path: string; route: Router }[] = [
  {
    path: "/auth",
    route: TenantAuthRoutes,
  },
  {
    path: "/plans",
    route: TenantPlanRoute,
  },
  {
    path: "/addons",
    route: TenantAddonRoute,
  },
  {
    path: "/entitlements",
    route: TenantEntitlementRoute,
  },
  {
    path: "/shops",
    route: TenantShopRoutes,
  },
  {
    path: "/",
    route: TenantPaymentRoute,
  },
];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
