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
        <p className="eyebrow rise">For clubs that run on volunteers</p>
        <h1 className="display rise-2 text-[44px] text-ink sm:text-[64px]">
          The one place your <span className="text-club">club</span> runs from.
        </h1>
        <p className="rise-3 max-w-xl text-[17px] leading-relaxed text-ink-muted">
          Registrations, a members database, coaches, parents and players. Your logo, your colours, live in five minutes. No technical setup, ever.
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
