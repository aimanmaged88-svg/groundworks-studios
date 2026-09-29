import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClubMark } from "@/components/club-mark";
import { Banner } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { getPublicClub } from "@/lib/public-club";
import { logoUrl } from "@/lib/storage";
import { RegistrationForm } from "./registration-form";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  return { title: data ? { absolute: `Register · ${data.club.name}` } : "Register" };
}

export default async function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  const { club, form, season } = data;

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col pb-16">
      <header className="band flex items-center gap-4 px-5 py-5">
        <Link href={`/c/${club.slug}`} className="shrink-0">
          <ClubMark name={club.name} src={logoUrl(club.logo_path)} size={52} />
        </Link>
        <div className="min-w-0">
          <h1 className="display text-[28px]">Register</h1>
          <p className="truncate text-[11.5px] font-bold uppercase tracking-[0.14em] opacity-80">
            {club.name}
            {season ? ` · ${season.name}` : ""}
          </p>
        </div>
      </header>

      {club.is_demo && <div className="bg-warn px-5 py-2 text-center text-[12px] font-bold uppercase tracking-[0.08em] text-bg">Demo club · don&rsquo;t enter real details</div>}

      {!form || !season?.registration_open ? (
        <div className="mt-6 px-5">
          <Banner tone="warn">
            <b>Registrations are closed right now.</b> Check back soon, or get in touch with the club.
          </Banner>
          <ButtonLink href={`/c/${club.slug}`} variant="outline" className="mt-4">
            Back to {club.short_name || club.name}
          </ButtonLink>
        </div>
      ) : (
        <div className="px-5">
          <RegistrationForm club={club} form={form} season={season} />
        </div>
      )}
    </main>
  );
}
