import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { ClubMark } from "@/components/club-mark";
import { ButtonLink } from "@/components/ui/button";
import { describeDivision } from "@/lib/age-rule";
import { getPublicClub, registrationsOpen } from "@/lib/public-club";
import { logoUrl, publicObjectUrl } from "@/lib/storage";
import { fmtDob, money } from "@/lib/utils";

export default async function PublicClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  const { club, season } = data;
  const page = club.public_page;
  const hero = publicObjectUrl("club-media", page.hero_path);
  const open = registrationsOpen(data);
  const ages = season?.divisions?.length ? `${season.divisions[0].name} to ${season.divisions[season.divisions.length - 1].name}` : null;
  const facts: Array<[string, string, string?]> = [];
  if (ages) facts.push(["Ages", ages, season?.divisions.map((d) => `${d.name} ${describeDivision(d, season.age_rule_mode)}`).join(" · ")]);
  if (page.when) facts.push(["When", page.when]);
  else if (season?.starts_on) facts.push(["Season starts", fmtDob(season.starts_on)]);
  if (page.where) facts.push(["Where", page.where]);
  else if (club.suburb) facts.push(["Where", [club.suburb, club.state].filter(Boolean).join(", ")]);
  facts.push(["Fee", season?.fee_cents ? money(season.fee_cents, { compact: true }) : "Confirmed by the club", season?.fee_cents ? (season.fee_label ?? undefined) : undefined]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col pb-16">
      {/* Masthead in the club's colour */}
      <section className="band relative overflow-hidden px-5 pb-8 pt-8">
        {hero && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity" />
        )}
        <div className="relative">
          <ClubMark name={club.name} src={logoUrl(club.logo_path)} size={76} className="ring-4 ring-[color-mix(in_oklab,var(--club-on-primary)_12%,transparent)]" />
          <h1 className="display mt-5 text-[44px] leading-[0.92]">{club.name}</h1>
          <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.16em] opacity-80">
            {[club.suburb, club.state].filter(Boolean).join(", ")}
            {season ? ` · ${season.name}` : ""}
          </p>
        </div>
      </section>

      {club.is_demo && <div className="bg-warn px-5 py-2 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-bg">Demo club · made-up data</div>}

      <section className="rise px-5 pt-8">
        <p className="eyebrow">{open ? "Registrations open" : "Registrations closed"}</p>
        <h2 className="display mt-2 text-[32px] text-ink">{page.headline ?? (open ? "Come and play" : "See you next season")}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-muted">
          {page.blurb ?? `Sign your child up with ${club.short_name || club.name}. The form takes about three minutes on your phone, and the club will be in touch to confirm the spot.`}
        </p>
        {open && (
          <ButtonLink href={`/c/${club.slug}/register`} size="lg" className="mt-6 w-full" icon={<ArrowRight className="size-4" />}>
            {page.cta ?? "Register"}
          </ButtonLink>
        )}
      </section>

      <section className="rise-2 mx-5 mt-10 rule-top">
        {facts.map(([k, v, s]) => (
          <div key={k} className="grid grid-cols-[96px_1fr] gap-4 border-b border-line py-4">
            <p className="eyebrow pt-1">{k}</p>
            <div>
              <p className="display text-[20px] text-ink">{v}</p>
              {s && <p className="mt-1 text-[12px] leading-relaxed text-ink-dim">{s}</p>}
            </div>
          </div>
        ))}
      </section>

      {(club.instagram_handle || club.website || club.contact_phone) && (
        <section className="rise-3 mx-5 mt-8 flex flex-wrap gap-2">
          {club.instagram_handle && (
            <a href={`https://instagram.com/${club.instagram_handle}`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[var(--r-md)] bg-elev px-4 text-[13px] font-bold text-ink">
              <InstagramIcon className="size-4" /> @{club.instagram_handle}
            </a>
          )}
          {club.website && (
            <a href={club.website} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-[var(--r-md)] bg-elev px-4 text-[13px] font-bold text-ink">
              Website
            </a>
          )}
          {club.contact_phone && (
            <a href={`sms:${club.contact_phone.replace(/\s/g, "")}`} className="inline-flex h-10 items-center gap-2 rounded-[var(--r-md)] bg-elev px-4 text-[13px] font-bold text-ink">
              Text the club
            </a>
          )}
        </section>
      )}

      <footer className="mt-auto px-5 pt-14 text-[11px] font-bold uppercase tracking-[0.16em] text-ink-dim">
        <Link href="/" className="hover:text-ink">
          Runs on Clubroom
        </Link>
      </footer>
    </main>
  );
}
