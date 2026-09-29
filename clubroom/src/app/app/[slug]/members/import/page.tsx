import type { Metadata } from "next";
import { getClubContext, requireAdmin } from "@/lib/club";
import { createClient } from "@/lib/supabase/server";
import { ImportView } from "./import-view";

export const metadata: Metadata = { title: "Import members" };

export default async function ImportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  requireAdmin(ctx);
  const supabase = await createClient();
  const { data: existing } = await supabase.from("people").select("first_name, last_name, dob").eq("club_id", ctx.club.id).eq("kind", "player").is("archived_at", null);
  const existingKeys = (existing ?? []).filter((p) => p.dob).map((p) => `${p.first_name.trim().toLowerCase()}|${p.last_name.trim().toLowerCase()}|${p.dob}`);
  return <ImportView slug={slug} seasonName={ctx.season?.name ?? null} existingKeys={existingKeys} />;
}
