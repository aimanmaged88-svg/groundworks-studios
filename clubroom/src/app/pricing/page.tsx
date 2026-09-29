import type { Metadata } from "next";
import { ArrowRight, Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PLANS, TRIAL_DAYS, type PlanKey } from "@/lib/plans";

export const metadata: Metadata = { title: "Pricing", description: "One monthly price per club. No per-registration fees. 30 days free." };

const FAQ: Array<[string, string]> = [
  ["Do parents pay anything?", "No. Clubroom charges the club, not the family. There are no per-registration fees on top."],
  ["What happens after the 30 days?", "Pick a plan and the trial finishes its course before the first charge. If you don't, the club is paused: nothing is deleted, registrations close until you choose a plan."],
  ["Is GST included?", "Yes. The prices shown include GST and you get a tax invoice from Stripe each month."],
  ["Can we pay yearly?", "Yes, two months free on a yearly plan. Ask when you sign up."],
  ["Where is our data kept?", "In Sydney, on Supabase. Medical details are only visible to your admins and each child's coach, and every look at them is logged."],
  ["Can we cancel?", "Any time, from Settings. Export your members first if you want a copy; it takes one click."],
];

export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 md:px-8">
        <section className="py-14 md:py-20">
          <div className="rule-top pt-4">
            <h1 className="display text-[44px] text-ink sm:text-[72px]">One price a month. That&rsquo;s it.</h1>
          </div>
          <p className="mt-6 max-w-xl text-[16px] leading-relaxed text-ink-muted">No per-registration fees, no ads, no card to start. Every plan begins with {TRIAL_DAYS} days free. Prices are early and may change before public launch; clubs on the pilot keep their price.</p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const p = PLANS[key];
            const featured = key === "club";
            return (
              <div key={key} className={`flex flex-col rounded-[var(--r-lg)] p-6 ${featured ? "band" : "bg-elev"}`}>
                <h2 className="display text-[26px]">{p.name}</h2>
                <p className={`mt-1 text-[13px] ${featured ? "opacity-80" : "text-ink-muted"}`}>{p.blurb}</p>
                <p className="mt-5">
                  <span className="numeral text-[48px]">${p.monthlyAud}</span>
                  <span className={`text-[12.5px] ${featured ? "opacity-80" : "text-ink-dim"}`}> / month inc. GST</span>
                </p>
                <ul className={`mt-5 flex flex-col gap-2 text-[14px] ${featured ? "" : "text-ink-muted"}`}>
                  {p.includes.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0" /> {i}
                    </li>
                  ))}
                </ul>
                <ButtonLink href="/sign-up" variant={featured ? "ink" : "primary"} size="lg" className="mt-8" icon={<ArrowRight className="size-4" />}>
                  Start free
                </ButtonLink>
              </div>
            );
          })}
        </section>

        <section className="mt-20 grid gap-8 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="rule-top pt-3">
              <h3 className="display text-[19px] text-ink">{q}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-muted">{a}</p>
            </div>
          ))}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
