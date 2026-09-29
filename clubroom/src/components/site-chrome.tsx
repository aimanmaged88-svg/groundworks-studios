import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function SiteHeader({ className }: { className?: string }) {
  return (
    <header className={cn("mx-auto flex w-full max-w-5xl items-center justify-between px-5 pt-6 md:px-8", className)}>
      <Link href="/" className="display text-[18px] text-ink">
        Clubroom
      </Link>
      <nav className="flex items-center gap-1 sm:gap-2">
        <Link href="/preview" className="hidden rounded-[var(--r-md)] px-3 py-2 text-[12.5px] font-bold uppercase tracking-[0.06em] text-ink-muted hover:text-ink sm:inline-block">
          See it in your colours
        </Link>
        <Link href="/pricing" className="rounded-[var(--r-md)] px-3 py-2 text-[12.5px] font-bold uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
          Pricing
        </Link>
        <Link href="/sign-in" className="rounded-[var(--r-md)] px-3 py-2 text-[12.5px] font-bold uppercase tracking-[0.06em] text-ink-muted hover:text-ink">
          Sign in
        </Link>
        <ThemeToggle />
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mx-auto mt-auto w-full max-w-5xl px-5 pb-10 pt-16 md:px-8">
      <div className="hairline flex flex-col gap-4 pt-6 text-[12px] text-ink-dim sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="display text-[14px] text-ink">Clubroom</span> · made in Bankstown by Groundworks Studio
        </p>
        <nav className="flex flex-wrap gap-4 font-bold uppercase tracking-[0.08em]">
          <Link href="/pricing" className="hover:text-ink">
            Pricing
          </Link>
          <Link href="/preview" className="hover:text-ink">
            Preview
          </Link>
          <Link href="/c/demo-hoops" className="hover:text-ink">
            Demo club
          </Link>
          <Link href="/sign-up" className="hover:text-ink">
            Start a club
          </Link>
        </nav>
      </div>
      <p className="mt-4 text-[11.5px] leading-relaxed text-ink-dim">Data is stored in Sydney. Privacy policy and terms are being finalised with legal review before public launch.</p>
    </footer>
  );
}
