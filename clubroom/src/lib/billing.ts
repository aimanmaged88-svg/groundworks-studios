/** Pure billing helpers (no server-only import, so they unit-test cleanly). */
import { memberLimitFor, planForPrice, type PlanKey } from "@/lib/plans";

export type SubscriptionPatch = {
  stripe_customer_id?: string;
  stripe_subscription_id?: string | null;
  status?: "trialing" | "active" | "past_due" | "cancelled" | "unpaid" | "paused";
  plan?: PlanKey;
  member_limit?: number;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
};

const STATUS: Record<string, SubscriptionPatch["status"]> = {
  trialing: "trialing",
  active: "active",
  past_due: "past_due",
  canceled: "cancelled",
  unpaid: "unpaid",
  paused: "paused",
  incomplete: "past_due",
  incomplete_expired: "cancelled",
};

const iso = (unix: number | null | undefined) => (unix ? new Date(unix * 1000).toISOString() : null);

/** Turns a Stripe subscription into the columns we store. Pure, so it's unit-tested. */
export function patchFromSubscription(sub: {
  id: string;
  customer: string | { id: string };
  status: string;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
  items: { data: Array<{ price: { id: string }; current_period_end?: number | null }> };
}): SubscriptionPatch {
  const item = sub.items.data[0];
  const plan = planForPrice(item?.price.id);
  const patch: SubscriptionPatch = {
    stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripe_subscription_id: sub.id,
    status: STATUS[sub.status] ?? "past_due",
    trial_ends_at: iso(sub.trial_end),
    current_period_end: iso(item?.current_period_end),
    cancel_at_period_end: !!sub.cancel_at_period_end,
  };
  if (plan) {
    patch.plan = plan;
    patch.member_limit = memberLimitFor(plan);
  }
  return patch;
}
