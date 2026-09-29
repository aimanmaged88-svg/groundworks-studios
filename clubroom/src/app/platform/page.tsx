import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ClubMark } from "@/components/club-mark";
import { ThemeToggle } from "@/components/theme-toggle";
import { Chip, SectionHead, StatTile } from "@/components/ui/card";
import { isPlatformOwner, requireUser } from "@/lib/auth";
import { logoUrl } from "@/lib/storage";
import { createAdminClient } from "@/lib/supabase/admin";
import { daysUntil, fmtDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Platform" };

/** Platform owner only: every club, its state and a way in. Opening a club you're not a member of is logged. */
export default async function PlatformPage() {
  await requireUser("/platform");
  if (!(await isPlatformOwner())) notFound();
  const admin = createAdminClient();
  const [{ data: clubs }, { data: subs }, { data: players }, { data: audits }] = await Promise.all([
    admin.from("clubs").select("id, slug, name, logo_path, status, is_demo, sport_key, suburb, state, created_at").order("created_at", { ascending: false }),
    admin.from("subscriptions").select("club_id, plan, status, trial_ends_at, member_limit"),
    admin.from("people").select("club_id").eq("kind", "player").is("archived_at", null),
    admin.from("audit_log").select("club_id, action, actor_user_id, at").order("at", { ascending: false }).limit(25),
  ]);
  const subBy = new Map((subs ?? []).map((s) => [s.club_id, s]));
  const playerCount = new Map<string, number>();
  for (const p of players ?? []) playerCount.set(p.club_id, (playerCount.get(p.club_id) ?? 0) + 1);
  const nameBy = new Map((clubs ?? []).map((c) => [c.id, c.name]));
  const live = (clubs ?? []).filter((c) => c.status === "active" && !c.is_demo);
  const paying = (subs ?? []).filter((s) => s.status === "active").length;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-8 px-5 py-6 md:px-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="display text-[18px] text-ink">
          Clubroom
        </Link>
        <ThemeToggle />
      </header>
      <div>
        <p className="eyebrow">Platform</p>
        <h1 className="display mt-1 text-[36px] text-ink md:text-[48px]">Every club</h1>
      </div>
      <div className="scoreboard">
        <StatTile value={live.length} label="Live clubs" tone="club" />
        <StatTile value={paying} label="Paying" />
        <StatTile value={(clubs ?? []).filter((c) => c.status === "onboarding").length} label="Still setting up" />
        <StatTile value={(players ?? []).length} label="Players on the platform" />
      </div>

      <section>
        <SectionHead title="Clubs" sub="Opening a club you're not an admin of is written to its audit log." />
        <ul>
          {(clubs ?? []).map((c) => {
            const s = subBy.get(c.id);
            const trial = s?.status === "trialing" ? daysUntil(s.trial_ends_at) : null;
            return (
              <li key={c.id} className="flex items-center gap-3 border-b border-line py-3">
                <ClubMark name={c.name} src={logoUrl(c.logo_path)} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[14.5px] font-bold text-ink">{c.name}</span>
                    {c.is_demo && <Chip tone="warn">demo</Chip>}
                    <Chip tone={c.status === "active" ? "ok" : "muted"}>{c.status}</Chip>
                  </span>
                  <span className="block text-[12px] text-ink-muted">
                    /c/{c.slug} · {c.sport_key} · {[c.suburb, c.state].filter(Boolean).join(", ") || "no location"} · since {fmtDate(c.created_at, "long")}
                  </span>
                </span>
                <span className="hidden text-right text-[12.5px] text-ink-muted sm:block">
                  <span className="numeral block text-[18px] text-ink">{playerCount.get(c.id) ?? 0}</span>players
                </span>
                <span className="hidden text-right text-[12.5px] text-ink-muted md:block">
                  <span className="block font-bold text-ink">{s ? `${s.plan} · ${s.status}` : "no subscription"}</span>
                  {trial !== null ? `${trial} trial days left` : `limit ${s?.member_limit ?? "—"}`}
                </span>
                <Link href={`/app/${c.slug}`} className="inline-flex h-9 items-center gap-1 rounded-[var(--r-md)] bg-elev2 px-3 text-[12px] font-bold uppercase tracking-[0.06em] text-ink hover:bg-line-strong">
                  Open <ArrowRight className="size-3.5" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <SectionHead title="Latest activity" sub="Across all clubs" />
        <ul className="text-[13px]">
          {(audits ?? []).map((a, i) => (
            <li key={i} className="flex items-center gap-3 border-b border-line py-2">
              <span className="w-40 shrink-0 text-ink-dim">{fmtDate(a.at, "time")}</span>
              <span className="font-bold text-ink">{a.action}</span>
              <span className="truncate text-ink-muted">{a.club_id ? (nameBy.get(a.club_id) ?? a.club_id) : "platform"}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
