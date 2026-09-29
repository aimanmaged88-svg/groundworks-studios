/** Pricing hypotheses (PLAN.md §4). Amounts are AUD inc. GST, per month. */
export type PlanKey = "starter" | "club" | "association";

export const PLANS: Record<PlanKey, { name: string; monthlyAud: number; memberLimit: number | null; blurb: string; includes: string[]; priceEnv: string }> = {
  starter: {
    name: "Starter",
    monthlyAud: 49,
    memberLimit: 100,
    blurb: "One program, one admin.",
    includes: ["Up to 100 players", "1 admin", "Registration form and public page", "Members database and exports"],
    priceEnv: "STRIPE_PRICE_STARTER",
  },
  club: {
    name: "Club",
    monthlyAud: 99,
    memberLimit: 400,
    blurb: "The usual junior club.",
    includes: ["Up to 400 players", "Unlimited admins and coaches", "Parent portal and progression (when released)", "Notices and exports"],
    priceEnv: "STRIPE_PRICE_CLUB",
  },
  association: {
    name: "Association",
    monthlyAud: 199,
    memberLimit: null,
    blurb: "Several programs or an association.",
    includes: ["Unlimited players", "Multiple programs", "Custom domain", "Priority support"],
    priceEnv: "STRIPE_PRICE_ASSOCIATION",
  },
};

export const TRIAL_DAYS = 30;

export function planForPrice(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null;
  for (const key of Object.keys(PLANS) as PlanKey[]) {
    if (process.env[PLANS[key].priceEnv] === priceId) return key;
  }
  return null;
}

export function memberLimitFor(plan: PlanKey) {
  return PLANS[plan].memberLimit ?? 100000;
}

/** Whether the club may still take registrations and use the app. */
export function subscriptionAllowsUse(sub: { status: string; trial_ends_at: string | null } | null, now = Date.now()) {
  if (!sub) return true; // no record yet: treat as trial
  if (sub.status === "active") return true;
  if (sub.status === "trialing") return !sub.trial_ends_at || new Date(sub.trial_ends_at).getTime() > now;
  if (sub.status === "past_due") return true; // grace: Stripe retries; we don't lock a club out over a failed card
  return false; // cancelled, unpaid, paused
}
