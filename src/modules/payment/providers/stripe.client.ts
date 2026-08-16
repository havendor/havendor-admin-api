import Stripe from "stripe";
import { APP_CONFIG } from "../../../config/index.js";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  if (!APP_CONFIG.STRIPE.secret_key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(APP_CONFIG.STRIPE.secret_key);
  }
  return stripeClient;
};
