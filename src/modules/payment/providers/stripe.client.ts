import Stripe from "stripe";
import appConfig from "../../../config/appConfig.js";

let stripeClient: Stripe | null = null;

export const getStripe = () => {
  if (!appConfig.STRIPE.secret_key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(appConfig.STRIPE.secret_key);
  }
  return stripeClient;
};
