import type { Metadata } from "next";
import { getClubContext, requireAdmin } from "@/lib/club";
import { loadMembers } from "@/lib/members-server";
import { createClient } from "@/lib/supabase/server";
import { MembersView } from "./members-view";

export const metadata: Metadata = { title: "Members" };

export default async function MembersPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  requireAdmin(ctx);
  const supabase = await createClient();
  const { rows, divisions, teams } = await loadMembers(supabase, ctx.club.id, ctx.season);
  const { data: form } = await supabase.from("form_templates").select("fields, consents").eq("club_id", ctx.club.id).eq("is_active", true).maybeSingle();
  const fields = (form?.fields ?? []) as Array<{ key: string; label: string; type: string; options?: string[]; maps_to?: string; section: string }>;

  return (
    <MembersView
      slug={slug}
      clubId={ctx.club.id}
      timezone={ctx.club.timezone}
      rows={rows}
      ageGroups={divisions.map((d) => d.name)}
      teams={teams}
      season={ctx.season ? { id: ctx.season.id, name: ctx.season.name, fee_cents: ctx.season.fee_cents } : null}
      fieldOptions={{
        gender: fields.find((f) => f.maps_to === "player.gender")?.options ?? ["Boy", "Girl", "Non-binary", "Prefer not to say"],
        experience: fields.find((f) => f.maps_to === "registration.experience")?.options ?? [],
        heard_via: fields.find((f) => f.maps_to === "registration.heard_via")?.options ?? [],
        uniform_size: fields.find((f) => f.maps_to === "registration.uniform_size")?.options ?? [],
        relationship: fields.find((f) => f.maps_to === "guardian.relationship")?.options ?? ["Mother", "Father", "Guardian", "Other"],
        ambulance_cover: fields.find((f) => f.maps_to === "sensitive.ambulance_cover")?.options ?? ["Yes", "No", "Not sure"],
      }}
      customFields={fields.filter((f) => !f.maps_to || f.maps_to === "custom").map((f) => ({ key: f.key, label: f.label }))}
    />
  );
}
