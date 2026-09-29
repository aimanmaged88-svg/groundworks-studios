import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClubTheme } from "@/components/club-mark";
import { getPublicClub } from "@/lib/public-club";
import { publicEnv } from "@/lib/env";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) return { title: "Club not found" };
  const { club, season } = data;
  const title = club.name;
  const description = club.public_page.blurb ?? (season?.registration_open ? `Registrations are open for ${season.name}. Sign up in about three minutes.` : `${club.name}${club.suburb ? `, ${club.suburb}` : ""}.`);
  const url = `${publicEnv.appUrl()}/c/${club.slug}`;
  return {
    title: { absolute: title },
    description,
    openGraph: { title, description, url, siteName: club.name, type: "website", locale: "en_AU" },
    twitter: { card: "summary_large_image", title, description },
    alternates: { canonical: url },
  };
}

export default async function PublicClubLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPublicClub(slug);
  if (!data) notFound();
  const theme = data.club.theme_default === "light" ? "light" : "dark";
  return (
    <div data-theme={theme} className="min-h-dvh bg-bg text-ink" style={{ colorScheme: theme }}>
      <ClubTheme colours={data.club.colours} className="min-h-dvh">
        {children}
      </ClubTheme>
    </div>
  );
}
