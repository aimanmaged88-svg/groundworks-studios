import "server-only";
import Stripe from "stripe";

let client: Stripe | null | undefined;

/** Stripe client, or null when billing isn't configured (local dev, early pilot). */
export function getStripe(): Stripe | null {
  if (client !== undefined) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  client = key ? new Stripe(key, { appInfo: { name: "Clubroom" } }) : null;
  return client;
}

export function stripeConfigured() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export { patchFromSubscription, type SubscriptionPatch } from "@/lib/billing";
