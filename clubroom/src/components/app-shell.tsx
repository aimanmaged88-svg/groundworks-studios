"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, LogOut, Settings, Share2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ClubMark } from "@/components/club-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Chip } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: ReactNode; exact?: boolean };

export function AppShell({
  slug,
  clubName,
  shortName,
  logoUrl,
  isDemo,
  isAdmin,
  trialDaysLeft,
  userEmail,
  signOut,
  children,
}: {
  slug: string;
  clubName: string;
  shortName: string | null;
  logoUrl: string | null;
  isDemo: boolean;
  isAdmin: boolean;
  trialDaysLeft: number | null;
  userEmail: string;
  signOut: () => Promise<void>;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const base = `/app/${slug}`;
  const items: NavItem[] = isAdmin
    ? [
        { href: base, label: "Home", icon: <LayoutDashboard className="size-[22px]" />, exact: true },
        { href: `${base}/members`, label: "Members", icon: <Users className="size-[22px]" /> },
        { href: `${base}/share`, label: "Share", icon: <Share2 className="size-[22px]" /> },
        { href: `${base}/settings`, label: "Settings", icon: <Settings className="size-[22px]" /> },
      ]
    : [{ href: base, label: "Home", icon: <LayoutDashboard className="size-[22px]" />, exact: true }];

  const active = (item: NavItem) => (item.exact ? pathname === item.href : pathname.startsWith(item.href));

  return (
    <div className="flex min-h-dvh">
      {/* Side rail (desktop) */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line px-4 py-5 md:flex">
        <Link href={base} className="band flex items-center gap-3 rounded-[var(--r-md)] px-3 py-3">
          <ClubMark name={clubName} src={logoUrl} size={40} />
          <span className="min-w-0">
            <span className="display block truncate text-[15px]">{shortName || clubName}</span>
            {isDemo ? <Chip tone="warn">Demo club</Chip> : <span className="block text-[11px] opacity-75">Clubroom</span>}
          </span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex items-center gap-3 border-l-[3px] px-3 py-2.5 text-[14px] font-bold uppercase tracking-[0.04em] transition-colors",
                active(it) ? "border-club text-ink" : "border-transparent text-ink-muted hover:text-ink",
              )}
            >
              <span className={cn(active(it) ? "text-club" : "text-ink-dim")}>{it.icon}</span>
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 px-2">
          {trialDaysLeft !== null && (
            <Link href={`${base}/settings/billing`} className="hairline pt-3 text-[12.5px] text-ink-muted hover:text-ink">
              <span className="numeral text-[22px] text-ink">{trialDaysLeft}</span> days left on the trial
            </Link>
          )}
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle label />
            <form action={signOut}>
              <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-3 text-[12.5px] font-semibold text-ink-muted hover:text-ink" title={userEmail}>
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar (phone) */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-3 backdrop-blur md:hidden">
          <ClubMark name={clubName} src={logoUrl} size={34} />
          <span className="display min-w-0 flex-1 truncate text-[15px] text-ink">{shortName || clubName}</span>
          {isDemo && <Chip tone="warn">Demo</Chip>}
          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-12 md:pt-8">{children}</main>

        {/* Bottom tabs (phone) */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className={cn("flex flex-1 flex-col items-center gap-1 py-2.5 text-[10.5px] font-bold", active(it) ? "text-club" : "text-ink-dim")}>
              {it.icon}
              {it.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
