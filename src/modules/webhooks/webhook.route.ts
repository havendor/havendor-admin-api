import { Request, Response, Router } from "express";
import httpStatus from "http-status";
import { APP_CONFIG } from "../../config/index.js";
import { catchAsync } from "../../middleware/index.js";
import { SslCommerzProvider } from "../payment/providers/sslcommerz.provider.js";
import { StripeProvider } from "../payment/providers/stripe.provider.js";

const parseBody = (req: Request): Record<string, string> => {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, string>;
  }
  return {};
};

export const stripeWebhookHandler = catchAsync(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  if (!signature || Array.isArray(signature)) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: "Missing stripe-signature" });
  }

  const rawBody = req.body as Buffer;
  const result = await StripeProvider.handleWebhook(rawBody, signature);
  return res.status(httpStatus.OK).json(result);
});

const sslIpn = catchAsync(async (req: Request, res: Response) => {
  const body = parseBody(req);
  const result = await SslCommerzProvider.processIpn(body);
  return res.status(httpStatus.OK).json(result);
});

const redirectWithQuery = (path: string) =>
  catchAsync(async (req: Request, res: Response) => {
    const body = { ...parseBody(req), ...(req.query as Record<string, string>) };
    try {
      await SslCommerzProvider.processIpn(body);
    } catch {
      // still redirect user
    }
    const status = body.status || "unknown";
    const url = `${APP_CONFIG.TENANT_FRONTEND_URL}${path}?status=${encodeURIComponent(status)}&payment_id=${encodeURIComponent(body.value_a || "")}`;
    return res.redirect(url);
  });

const router = Router();

router.post("/sslcommerz/ipn", sslIpn);
router.post("/sslcommerz/success", redirectWithQuery("/billing/success"));
router.post("/sslcommerz/fail", redirectWithQuery("/billing/fail"));
router.post("/sslcommerz/cancel", redirectWithQuery("/billing/cancel"));
router.get("/sslcommerz/success", redirectWithQuery("/billing/success"));
router.get("/sslcommerz/fail", redirectWithQuery("/billing/fail"));
router.get("/sslcommerz/cancel", redirectWithQuery("/billing/cancel"));

export const WebhookRoutes = router;
