import { Router } from "express";
import { AdminRoute } from "../modules/admin/admin/admin.route.js";
import { AuthRoutes } from "../modules/admin/auth/auth.route.js";
import { DatabaseRoute } from "../modules/admin/database/database.route.js";
import { AdminPaymentRoute } from "../modules/admin/payment/payment.route.js";
import { PaymentMethodRoute } from "../modules/admin/payment-method/paymentMethod.route.js";
import { PlanRoute } from "../modules/admin/plan/plan.route.js";
import { RoleRoute } from "../modules/admin/role/role.route.js";
import { ServerRoute } from "../modules/admin/server/server.route.js";
import { ShopRoute } from "../modules/admin/shop/shop.route.js";
import { ShopDomainRoute } from "../modules/admin/shop-domain/shopDomain.route.js";
import { AdminSubscriptionRoute } from "../modules/admin/subscription/subscription.route.js";
import { TenantRoute } from "../modules/admin/tenant/tenant.route.js";
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
  {
    path: "/tenant",
    route: TenantRoute,
  },
  {
    path: "/payment-methods",
    route: PaymentMethodRoute,
  },
  {
    path: "/payments",
    route: AdminPaymentRoute,
  },
  {
    path: "/subscriptions",
    route: AdminSubscriptionRoute,
  },
  {
    path: "/servers",
    route: ServerRoute,
  },
  {
    path: "/databases",
    route: DatabaseRoute,
  },
  {
    path: "/shops",
    route: ShopRoute,
  },
  {
    path: "/shop-domains",
    route: ShopDomainRoute,
  },
  {
    path: "/plans",
    route: PlanRoute,
  },
];

routes.forEach((route) => {
  const config =
    routeRateConfig.find((c) => c.match(route.path)) || routeRateConfig[routeRateConfig.length - 1];

  router.use(route.path, config.limiter, route.route);
});

export default router;
