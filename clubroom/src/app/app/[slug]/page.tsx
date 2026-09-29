import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import { ClubMark } from "@/components/club-mark";
import { ButtonLink } from "@/components/ui/button";
import { Banner, EmptyState, SectionHead, StatTile } from "@/components/ui/card";
import { getClubContext } from "@/lib/club";
import { publicEnv } from "@/lib/env";
import { logoUrl } from "@/lib/storage";
import { createClient } from "@/lib/supabase/server";
import { daysAgoIso, fmtDate, money, pluralise } from "@/lib/utils";
import { CopyLink } from "./copy-link";

export default async function ClubHome({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ welcome?: string }> }) {
  const { slug } = await params;
  const { welcome } = await searchParams;
  const ctx = await getClubContext(slug);
  const supabase = await createClient();
  const link = `${publicEnv.appUrl()}/c/${ctx.club.slug}/register`;

  if (!ctx.isAdmin) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="band flex flex-col items-center gap-3 rounded-[var(--r-xl)] px-6 py-12 text-center">
          <ClubMark name={ctx.club.name} src={logoUrl(ctx.club.logo_path)} size={72} />
          <h1 className="display mt-2 text-[28px]">{ctx.club.name}</h1>
          <p className="max-w-sm text-[14px] opacity-80">You&rsquo;re in. The coach and parent views are on their way; for now your club admin will be in touch about the season.</p>
        </div>
      </div>
    );
  }

  const weekAgo = daysAgoIso(7);
  const [{ count: total }, { count: recent }, { data: owing }, { count: openTasks }, { data: latest }] = await Promise.all([
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("club_id", ctx.club.id).neq("status", "withdrawn"),
    supabase.from("registrations").select("id", { count: "exact", head: true }).eq("club_id", ctx.club.id).gte("submitted_at", weekAgo),
    supabase.from("fees").select("amount_cents").eq("club_id", ctx.club.id).in("status", ["owing", "partial"]),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("club_id", ctx.club.id).eq("status", "open"),
    supabase
      .from("registrations")
      .select("id, submitted_at, status, people!registrations_player_person_id_fkey(first_name, last_name, dob)")
      .eq("club_id", ctx.club.id)
      .order("submitted_at", { ascending: false })
      .limit(6),
  ]);
  const owingCents = (owing ?? []).reduce((s, f) => s + f.amount_cents, 0);

  return (
    <div className="flex flex-col gap-8">
      {welcome && (
        <Banner tone="club">
          <b className="text-[15px]">You&rsquo;re live.</b> Share the registration link and every sign-up shows up under Members, for every admin, on any phone.
          <div className="mt-3">
            <CopyLink value={link} />
          </div>
        </Banner>
      )}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{ctx.season?.name ?? "No season yet"}</p>
          <h1 className="display mt-1 text-[36px] text-ink md:text-[48px]">{ctx.club.name}</h1>
        </div>
        <ButtonLink href={`/app/${slug}/members`} variant="ink" size="md" icon={<ArrowRight className="size-4" />}>
          Members
        </ButtonLink>
      </div>

      <div className="scoreboard">
        <StatTile value={total ?? 0} label="Registrations" tone="club" />
        <StatTile value={recent ?? 0} label="Last 7 days" />
        <StatTile value={money(owingCents, { compact: true })} label={`Owing · ${pluralise((owing ?? []).length, "player")}`} tone={owingCents > 0 ? "warn" : "default"} />
        <StatTile value={openTasks ?? 0} label="Open follow-ups" />
      </div>

      <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionHead title="Latest registrations" sub="Newest first" action={<Link href={`/app/${slug}/members`} className="text-[12px] font-bold uppercase tracking-[0.06em] text-club">All members</Link>} />
          {latest && latest.length > 0 ? (
            <ul>
              {latest.map((r) => {
                const p = r.people as { first_name: string; last_name: string; dob: string | null } | null;
                return (
                  <li key={r.id} className="flex items-center gap-3 border-b border-line py-3">
                    <span className="numeral w-8 text-[13px] text-ink-dim">{(p?.first_name?.[0] ?? "?") + (p?.last_name?.[0] ?? "")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14.5px] font-semibold text-ink">
                        {p?.first_name} {p?.last_name}
                      </span>
                    </span>
                    <span className="text-[12px] text-ink-dim">{fmtDate(r.submitted_at, "time", ctx.club.timezone)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState icon={<ClipboardList className="size-5" />} title="Nothing yet" text="Share the link. The first registration shows up here the moment it's submitted." />
          )}
        </section>

        <div className="flex min-w-0 flex-col gap-8">
          <section>
            <SectionHead title="Registration link" sub="Instagram bio, WhatsApp group, flyer." />
            <div className="mt-4">
              <CopyLink value={link} />
            </div>
            <Link href={`/app/${slug}/share`} className="mt-3 inline-block text-[12px] font-bold uppercase tracking-[0.06em] text-club">
              QR code and share buttons
            </Link>
          </section>
          {ctx.season && (
            <section>
              <SectionHead title={ctx.season.name} />
              <p className="mt-3 text-[13.5px] text-ink-muted">
                {ctx.season.registration_open ? "Registrations open" : "Registrations closed"} · Fee {ctx.season.fee_cents ? `${money(ctx.season.fee_cents, { compact: true })} ${ctx.season.fee_label ?? ""}` : "to be confirmed"}
              </p>
              <Link href={`/app/${slug}/settings/season`} className="mt-3 inline-block text-[12px] font-bold uppercase tracking-[0.06em] text-club">
                Season settings
              </Link>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
