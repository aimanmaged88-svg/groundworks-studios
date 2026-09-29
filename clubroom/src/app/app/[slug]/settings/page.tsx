import type { Metadata } from "next";
import { getClubContext } from "@/lib/club";
import { ClubSettingsForm } from "./club-form";

export const metadata: Metadata = { title: "Club settings" };

export default async function ClubSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  const page = ctx.club.public_page as { headline?: string; blurb?: string; cta?: string; when?: string; where?: string };
  return (
    <ClubSettingsForm
      slug={slug}
      clubId={ctx.club.id}
      initial={{
        name: ctx.club.name,
        short_name: ctx.club.short_name ?? "",
        suburb: ctx.club.suburb ?? "",
        state: ctx.club.state ?? "",
        contact_email: ctx.club.contact_email ?? "",
        contact_phone: ctx.club.contact_phone ?? "",
        instagram_handle: ctx.club.instagram_handle ?? "",
        website: ctx.club.website ?? "",
        primary: ctx.club.colours.primary,
        accent: ctx.club.colours.accent,
        theme_default: ctx.club.theme_default === "light" ? "light" : "dark",
        logo_path: ctx.club.logo_path,
        public_page: { headline: page.headline ?? "", blurb: page.blurb ?? "", cta: page.cta ?? "", when: page.when ?? "", where: page.where ?? "" },
      }}
    />
  );
}
