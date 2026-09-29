import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { PLANS } from "@/lib/plans";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-5 md:px-8">
        {/* Hero */}
        <section className="py-16 md:py-24">
          <div className="rule-top pt-4">
            <h1 className="display rise text-[52px] text-ink sm:text-[88px]">
              Stop running
              <br />
              the club out of
              <br />a <span className="text-club">group chat.</span>
            </h1>
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_1fr]">
            <p className="rise-2 text-[17px] leading-relaxed text-ink-muted">
              Parents fill in one form. You see who&rsquo;s registered, who&rsquo;s paid and who&rsquo;s turning up. Coaches get their team, parents get their kid&rsquo;s schedule. It carries your logo and colours, and there&rsquo;s nothing technical to set up.
            </p>
            <div className="rise-3 flex flex-col gap-3 md:items-end">
              <ButtonLink href="/sign-up" size="lg" icon={<ArrowRight className="size-4" />} className="w-full md:w-auto">
                Start your club
              </ButtonLink>
              <ButtonLink href="/preview" variant="ghost" size="md">
                See it in your colours first
              </ButtonLink>
            </div>
          </div>
        </section>

        {/* Product shots */}
        <section className="grid items-start gap-4 md:grid-cols-[1.6fr_1fr]">
          <figure className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-elev">
            <Image src="/screens/members-desktop.png" alt="The members database: numbers up top, a breakdown by age group and gender, and every registration in one sortable list" width={1360} height={860} className="w-full" priority />
            <figcaption className="px-4 py-3 text-[12.5px] text-ink-muted">Every registration in one list. Filter it, then export exactly what&rsquo;s on screen. Demo club shown.</figcaption>
          </figure>
          <div className="grid grid-cols-2 gap-4">
            <figure className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-elev">
              <Image src="/screens/public-phone.png" alt="A club's public page in its own colours with a register button" width={780} height={1560} className="w-full" />
            </figure>
            <figure className="overflow-hidden rounded-[var(--r-lg)] border border-line bg-elev">
              <Image src="/screens/home-phone-light.png" alt="The admin home on a phone, light theme" width={780} height={1560} className="w-full" />
            </figure>
          </div>
        </section>

        {/* What it does, plainly */}
        <section className="mt-20 grid gap-10 md:grid-cols-3">
          {[
            ["01", "Registrations that land in one place", "Your own registration page, in your colours, on a link you can put in the Instagram bio. Every sign-up shows up for every admin on any phone. Medical details are only visible to admins and that child's coach, and every look at them is logged."],
            ["02", "A members database that answers the questions", "How many under-12 girls? Who hasn't paid? Who hasn't given photo consent? Tap a number to filter, then export to Excel. Duplicates get flagged on name and date of birth."],
            ["03", "Set up in the time it takes to warm up", "Club name, logo, a season with your association's age rules, a fee or \"we'll confirm\". You're live at the end of the wizard. No tokens, no DNS, no hosting dashboard."],
          ].map(([n, t, body]) => (
            <div key={n} className="rule-top pt-3">
              <span className="numeral text-[18px] text-club">{n}</span>
              <h2 className="display mt-2 text-[24px] text-ink">{t}</h2>
              <p className="mt-3 text-[14.5px] leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </section>

        {/* Coming, and honest about it */}
        <section className="mt-20 grid gap-10 md:grid-cols-2">
          <div className="rule-top pt-3">
            <h2 className="display text-[24px] text-ink">On the way</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[14.5px] text-ink-muted">
              <li>Coach roll call that feeds each player&rsquo;s attendance.</li>
              <li>Parent app: this week&rsquo;s game, directions, add to calendar, fees, forms.</li>
              <li>Player levels earned by turning up, skills unlocked for coach rating, badges. Nothing that ranks one kid against another.</li>
              <li>Notices by team or by role, and online fee payment.</li>
            </ul>
          </div>
          <div className="rule-top pt-3">
            <h2 className="display text-[24px] text-ink">What it isn&rsquo;t</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[14.5px] text-ink-muted">
              <li>It doesn&rsquo;t run competitions or draws. Your association&rsquo;s system (PlayHQ, Basketball Connect) does that; Clubroom sits beside it.</li>
              <li>It doesn&rsquo;t show ads to your parents.</li>
              <li>It doesn&rsquo;t make numbers up. If you haven&rsquo;t set a fee, the form says the club will confirm it.</li>
            </ul>
          </div>
        </section>

        {/* Pricing teaser */}
        <section className="mt-20">
          <div className="rule-top flex flex-wrap items-end justify-between gap-4 pt-3">
            <h2 className="display text-[28px] text-ink">One monthly price. No per-registration fees.</h2>
            <Link href="/pricing" className="text-[12.5px] font-bold uppercase tracking-[0.06em] text-club">
              Full pricing
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {(Object.entries(PLANS) as Array<[string, (typeof PLANS)[keyof typeof PLANS]]>).map(([key, p]) => (
              <div key={key} className="rounded-[var(--r-lg)] bg-elev p-5">
                <h3 className="display text-[20px] text-ink">{p.name}</h3>
                <p className="mt-1 text-[12.5px] text-ink-muted">{p.blurb}</p>
                <p className="mt-3">
                  <span className="numeral text-[34px] text-ink">${p.monthlyAud}</span>
                  <span className="text-[12px] text-ink-dim"> / month inc. GST</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-ink-dim">30 days free, no card to start. Prices are early and may change before launch.</p>
        </section>

        <section className="mt-20 rounded-[var(--r-xl)] band px-6 py-10 md:px-10">
          <h2 className="display text-[34px] md:text-[44px]">Try it with your own logo.</h2>
          <p className="mt-2 max-w-xl text-[15px] opacity-85">Type your club&rsquo;s name and Instagram handle and see the registration page, the members list and the parent app in your colours. Takes a minute.</p>
          <ButtonLink href="/preview" variant="ink" size="lg" className="mt-6" icon={<ArrowRight className="size-4" />}>
            Build the preview
          </ButtonLink>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
