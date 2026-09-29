"use server";

import { redirect } from "next/navigation";
import { getClubContext } from "@/lib/club";
import { publicEnv } from "@/lib/env";
import { PLANS, type PlanKey } from "@/lib/plans";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


export async function startCheckoutAction(slug: string, plan: PlanKey): Promise<void> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("Admins only.")}`);
  const stripe = getStripe();
  const price = process.env[PLANS[plan].priceEnv];
  if (!stripe || !price) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("Billing isn't switched on yet.")}`);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id, trial_ends_at, status").eq("club_id", ctx.club.id).maybeSingle();

  let customer = sub?.stripe_customer_id ?? null;
  if (!customer) {
    const c = await stripe.customers.create({ name: ctx.club.name, email: user?.email ?? undefined, metadata: { club_id: ctx.club.id, slug } });
    customer = c.id;
    await admin.from("subscriptions").upsert({ club_id: ctx.club.id, stripe_customer_id: customer }, { onConflict: "club_id" });
  }

  // Keep whatever trial is left; Stripe needs at least 48 hours to count it.
  const trialEnd = sub?.status === "trialing" && sub.trial_ends_at ? Math.floor(new Date(sub.trial_ends_at).getTime() / 1000) : null;
  const keepTrial = trialEnd && trialEnd > Math.floor(Date.now() / 1000) + 48 * 3600;
  const base = `${publicEnv.appUrl()}/app/${slug}/settings/billing`;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer,
    client_reference_id: ctx.club.id,
    line_items: [{ price, quantity: 1 }],
    subscription_data: { metadata: { club_id: ctx.club.id, slug }, ...(keepTrial ? { trial_end: trialEnd } : {}) },
    allow_promotion_codes: true,
    success_url: `${base}?done=1`,
    cancel_url: base,
    metadata: { club_id: ctx.club.id },
  });
  if (!session.url) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("Stripe didn't return a checkout link.")}`);
  redirect(session.url);
}

export async function openPortalAction(slug: string): Promise<void> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("Admins only.")}`);
  const stripe = getStripe();
  if (!stripe) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("Billing isn't switched on yet.")}`);
  const admin = createAdminClient();
  const { data: sub } = await admin.from("subscriptions").select("stripe_customer_id").eq("club_id", ctx.club.id).maybeSingle();
  if (!sub?.stripe_customer_id) redirect(`${publicEnv.appUrl()}/app/${slug}/settings/billing?error=${encodeURIComponent("No billing account yet. Pick a plan first.")}`);
  const portal = await stripe.billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${publicEnv.appUrl()}/app/${slug}/settings/billing` });
  redirect(portal.url);
}
