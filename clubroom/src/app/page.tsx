import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="club-glow mx-auto flex min-h-dvh max-w-3xl flex-col px-5 pb-16 pt-6">
      <header className="flex items-center justify-between">
        <span className="display text-[18px] text-ink">Clubroom</span>
        <ThemeToggle />
      </header>
      <section className="flex flex-1 flex-col justify-center gap-6 py-16">
        <p className="eyebrow rise">Junior sport, sorted</p>
        <h1 className="display rise-2 text-[44px] text-ink sm:text-[64px]">
          Stop running the club out of a <span className="text-club">group chat</span>.
        </h1>
        <p className="rise-3 max-w-xl text-[17px] leading-relaxed text-ink-muted">
          Parents fill in one form. You see who&rsquo;s registered, who&rsquo;s paid and who&rsquo;s turning up. Coaches get their team, parents get their kid&rsquo;s schedule. It carries your logo and colours, and there&rsquo;s nothing technical to set up.
        </p>
        <div className="rise-4 flex flex-wrap gap-3">
          <ButtonLink href="/sign-up" size="lg" icon={<ArrowRight className="size-4" />}>
            Start your club
          </ButtonLink>
          <ButtonLink href="/sign-in" variant="outline" size="lg">
            Sign in
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
