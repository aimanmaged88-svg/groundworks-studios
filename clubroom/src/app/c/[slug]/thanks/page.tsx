import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { ClubMark } from "@/components/club-mark";
import { ButtonLink } from "@/components/ui/button";
import { getPublicClub } from "@/lib/public-club";
import { logoUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Registered" };

export default async function ThanksPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  const { club, season } = data;
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col pb-16">
      <section className="band flex flex-col items-start px-5 pb-10 pt-8">
        <ClubMark name={club.name} src={logoUrl(club.logo_path)} size={64} />
        <span className="mt-8 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] opacity-80">
          <Check className="size-4" strokeWidth={3} /> Registration received
        </span>
        <h1 className="display mt-2 text-[56px]">You&rsquo;re in</h1>
      </section>
      <div className="px-5 pt-8">
      <p className="max-w-sm text-[15.5px] leading-relaxed text-ink-muted">
        The registration is with {club.short_name || club.name}{season ? ` for ${season.name}` : ""}. The club will confirm the spot by text or email.
        {season?.fee_cents ? " Nothing to pay right now; they'll tell you how." : ""}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/c/${club.slug}/register`} variant="ink">
          Register another child
        </ButtonLink>
        {club.instagram_handle && (
          <ButtonLink href={`https://instagram.com/${club.instagram_handle}`} variant="outline" icon={<InstagramIcon className="size-4" />} target="_blank" rel="noreferrer">
            Follow @{club.instagram_handle}
          </ButtonLink>
        )}
      </div>
      </div>
    </main>
  );
}
