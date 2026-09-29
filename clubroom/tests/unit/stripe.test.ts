import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { patchFromSubscription } from "@/lib/billing";
import { subscriptionAllowsUse } from "@/lib/plans";

describe("patchFromSubscription", () => {
  beforeEach(() => {
    process.env.STRIPE_PRICE_CLUB = "price_club_test";
    process.env.STRIPE_PRICE_STARTER = "price_starter_test";
  });
  afterEach(() => {
    delete process.env.STRIPE_PRICE_CLUB;
    delete process.env.STRIPE_PRICE_STARTER;
  });

  it("maps a trialing Club subscription", () => {
    const patch = patchFromSubscription({
      id: "sub_1",
      customer: "cus_1",
      status: "trialing",
      trial_end: 1_800_000_000,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: "price_club_test" }, current_period_end: 1_800_000_000 }] },
    });
    expect(patch).toEqual({
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      status: "trialing",
      trial_ends_at: "2027-01-15T08:00:00.000Z",
      current_period_end: "2027-01-15T08:00:00.000Z",
      cancel_at_period_end: false,
      plan: "club",
      member_limit: 400,
    });
  });

  it("maps cancellation and an unknown price without touching the plan", () => {
    const patch = patchFromSubscription({ id: "sub_2", customer: { id: "cus_2" }, status: "canceled", items: { data: [{ price: { id: "price_unknown" } }] } });
    expect(patch.status).toBe("cancelled");
    expect(patch.plan).toBeUndefined();
    expect(patch.member_limit).toBeUndefined();
    expect(patch.stripe_customer_id).toBe("cus_2");
  });
});

describe("subscriptionAllowsUse", () => {
  const now = Date.parse("2026-09-29T00:00:00Z");
  it("allows trials until they end, active and past_due; blocks cancelled and unpaid", () => {
    expect(subscriptionAllowsUse(null, now)).toBe(true);
    expect(subscriptionAllowsUse({ status: "trialing", trial_ends_at: "2026-10-01T00:00:00Z" }, now)).toBe(true);
    expect(subscriptionAllowsUse({ status: "trialing", trial_ends_at: "2026-09-01T00:00:00Z" }, now)).toBe(false);
    expect(subscriptionAllowsUse({ status: "active", trial_ends_at: null }, now)).toBe(true);
    expect(subscriptionAllowsUse({ status: "past_due", trial_ends_at: null }, now)).toBe(true);
    expect(subscriptionAllowsUse({ status: "cancelled", trial_ends_at: null }, now)).toBe(false);
    expect(subscriptionAllowsUse({ status: "unpaid", trial_ends_at: null }, now)).toBe(false);
  });
});
