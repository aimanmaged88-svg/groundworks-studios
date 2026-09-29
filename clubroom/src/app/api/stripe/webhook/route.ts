import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { patchFromSubscription } from "@/lib/billing";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe → subscriptions table. The only writer of that table. Verifies the
 * signature, then upserts whatever Stripe says is true.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "billing not configured" }, { status: 503 });

  const sig = request.headers.get("stripe-signature");
  const raw = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", secret);
  } catch (e) {
    return NextResponse.json({ error: `bad signature: ${e instanceof Error ? e.message : "unknown"}` }, { status: 400 });
  }

  const admin = createAdminClient();

  async function apply(sub: Stripe.Subscription) {
    const clubId = sub.metadata?.club_id;
    const patch = patchFromSubscription(sub as unknown as Parameters<typeof patchFromSubscription>[0]);
    let query = admin.from("subscriptions").update({ ...patch, updated_at: new Date().toISOString() });
    query = clubId ? query.eq("club_id", clubId) : query.eq("stripe_customer_id", patch.stripe_customer_id!);
    const { data, error } = await query.select("club_id");
    if (error) throw error;
    const id = data?.[0]?.club_id ?? clubId ?? null;
    await admin.from("audit_log").insert({ club_id: id, action: `billing.${event.type}`, target_table: "subscriptions", target_id: sub.id, detail: { status: patch.status, plan: patch.plan ?? null } });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const clubId = session.metadata?.club_id ?? session.client_reference_id;
        if (clubId && typeof session.customer === "string") {
          await admin.from("subscriptions").update({ stripe_customer_id: session.customer, updated_at: new Date().toISOString() }).eq("club_id", clubId);
        }
        if (typeof session.subscription === "string") {
          const sub = await stripe.subscriptions.retrieve(session.subscription);
          if (!sub.metadata?.club_id && clubId) sub.metadata = { ...sub.metadata, club_id: clubId };
          await apply(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
      case "customer.subscription.paused":
      case "customer.subscription.resumed":
      case "customer.subscription.trial_will_end":
        await apply(event.data.object);
        break;
      default:
        break;
    }
  } catch (e) {
    console.error("stripe webhook failed", event.type, e);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
