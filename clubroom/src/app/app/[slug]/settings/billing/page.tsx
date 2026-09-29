import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Banner, Chip, SectionHead } from "@/components/ui/card";
import { getClubContext } from "@/lib/club";
import { PLANS, subscriptionAllowsUse, TRIAL_DAYS, type PlanKey } from "@/lib/plans";
import { stripeConfigured } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { cn, daysUntil, fmtDate } from "@/lib/utils";
import { openPortalAction, startCheckoutAction } from "./actions";

export const metadata: Metadata = { title: "Billing" };

const STATUS_WORDS: Record<string, string> = { trialing: "Free trial", active: "Active", past_due: "Payment overdue", cancelled: "Cancelled", unpaid: "Unpaid", paused: "Paused" };

export default async function BillingPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ done?: string; error?: string }> }) {
  const { slug } = await params;
  const { done, error } = await searchParams;
  const ctx = await getClubContext(slug);
  const supabase = await createClient();
  const { count: players } = await supabase.from("people").select("id", { count: "exact", head: true }).eq("club_id", ctx.club.id).eq("kind", "player").is("archived_at", null);
  const sub = ctx.subscription;
  const configured = stripeConfigured();
  const trialLeft = sub?.status === "trialing" ? daysUntil(sub.trial_ends_at) : null;
  const usable = subscriptionAllowsUse(sub);
  const currentPlan = (sub?.plan ?? "club") as PlanKey;

  return (
    <div className="flex flex-col gap-8">
      {done && (
        <Banner tone="ok">
          <span>Thanks. Stripe will confirm the subscription in a moment and this page updates by itself.</span>
        </Banner>
      )}
      {error && (
        <Banner tone="danger">
          <span>{error}</span>
        </Banner>
      )}
      {!usable && (
        <Banner tone="danger">
          <b>The club is paused.</b> Registrations are closed and the app is read-only until a plan is chosen.
        </Banner>
      )}

      <section>
        <SectionHead title="Where you're at" number="01" />
        <div className="scoreboard mt-3">
          <div>
            <span className="numeral text-[34px] text-ink">{STATUS_WORDS[sub?.status ?? "trialing"]}</span>
            <span className="eyebrow block">{sub?.plan ? `${PLANS[sub.plan as PlanKey]?.name ?? sub.plan} plan` : "No plan yet"}</span>
          </div>
          <div>
            <span className={cn("numeral text-[34px]", trialLeft !== null && trialLeft <= 5 ? "text-warn" : "text-ink")}>{trialLeft !== null ? trialLeft : sub?.current_period_end ? fmtDate(sub.current_period_end) : "—"}</span>
            <span className="eyebrow block">{trialLeft !== null ? "trial days left" : "next renewal"}</span>
          </div>
          <div>
            <span className="numeral text-[34px] text-ink">{players ?? 0}</span>
            <span className="eyebrow block">of {sub?.member_limit ?? PLANS.club.memberLimit} players</span>
          </div>
          <div>
            <span className="numeral text-[34px] text-ink">${PLANS[currentPlan].monthlyAud}</span>
            <span className="eyebrow block">a month, inc. GST</span>
          </div>
        </div>
        <p className="mt-3 text-[13px] text-ink-muted">
          Every club starts with {TRIAL_DAYS} days free and no card. Pick a plan any time before the trial ends and the trial still runs its course.
        </p>
      </section>

      {!configured && (
        <Banner tone="warn">
          <span>Card payments aren&rsquo;t switched on in this environment yet. Nothing is charged; the trial keeps running.</span>
        </Banner>
      )}

      <section>
        <SectionHead title="Plans" number="02" sub="Prices are early and may change before launch. You'll always be told first." />
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const p = PLANS[key];
            const current = sub?.plan === key && sub.status === "active";
            return (
              <div key={key} className={cn("flex flex-col rounded-[var(--r-lg)] border-2 bg-elev p-5", current ? "border-club" : "border-transparent")}>
                <div className="flex items-center justify-between">
                  <h3 className="display text-[22px] text-ink">{p.name}</h3>
                  {current && <Chip tone="club">Current</Chip>}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-muted">{p.blurb}</p>
                <p className="mt-4">
                  <span className="numeral text-[40px] text-ink">${p.monthlyAud}</span>
                  <span className="text-[12.5px] text-ink-dim"> / month</span>
                </p>
                <ul className="mt-4 flex flex-col gap-1.5 text-[13px] text-ink-muted">
                  {p.includes.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-ok" /> {i}
                    </li>
                  ))}
                </ul>
                <form action={startCheckoutAction.bind(null, slug, key)} className="mt-5">
                  <Button type="submit" variant={current ? "outline" : key === "club" ? "primary" : "secondary"} className="w-full" disabled={!configured || current}>
                    {current ? "Your plan" : sub?.status === "active" ? "Switch" : "Choose"}
                  </Button>
                </form>
              </div>
            );
          })}
        </div>
      </section>

      {sub?.stripe_customer_id && configured && (
        <section>
          <SectionHead title="Invoices and card" number="03" sub="Handled by Stripe. Update the card, download invoices, or cancel." />
          <form action={openPortalAction.bind(null, slug)} className="mt-3">
            <Button type="submit" variant="outline">
              Open billing portal
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
