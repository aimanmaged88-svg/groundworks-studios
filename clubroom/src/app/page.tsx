import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-4xl flex-col px-5 pb-16 pt-6 md:px-8">
      <header className="flex items-center justify-between">
        <span className="display text-[18px] text-ink">Clubroom</span>
        <ThemeToggle />
      </header>

      <section className="flex flex-1 flex-col justify-center py-16">
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
            <ButtonLink href="/sign-in" variant="ghost" size="md">
              Sign in
            </ButtonLink>
          </div>
        </div>
        <dl className="rise-4 mt-16 grid grid-cols-3 gap-4 hairline pt-5">
          {[
            ["30", "days free"],
            ["3 min", "for a parent to register"],
            ["0", "settings screens to fear"],
          ].map(([v, l]) => (
            <div key={l}>
              <dt className="numeral text-[28px] text-ink sm:text-[36px]">{v}</dt>
              <dd className="eyebrow mt-1">{l}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
