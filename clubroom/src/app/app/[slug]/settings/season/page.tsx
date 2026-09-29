import type { Metadata } from "next";
import { getClubContext } from "@/lib/club";
import { createClient } from "@/lib/supabase/server";
import type { Division } from "@/lib/age-rule";
import { SeasonSettings } from "./season-settings";

export const metadata: Metadata = { title: "Season settings" };

export default async function SeasonSettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ctx = await getClubContext(slug);
  const supabase = await createClient();
  const [{ data: sport }, { data: divisions }, { data: venues }] = await Promise.all([
    supabase.from("sports").select("name, default_divisions").eq("key", ctx.club.sport_key).single(),
    ctx.season ? supabase.from("divisions").select("name, sort, gender, born_from, born_to, min_age, max_age").eq("season_id", ctx.season.id).order("sort") : Promise.resolve({ data: [] as Division[] }),
    supabase.from("venues").select("id, name, address").eq("club_id", ctx.club.id).order("created_at"),
  ]);
  return (
    <SeasonSettings
      slug={slug}
      clubId={ctx.club.id}
      sportName={sport?.name ?? "your sport"}
      defaults={(sport?.default_divisions as Array<{ name: string; min_age?: number | null; max_age?: number | null }>) ?? []}
      season={ctx.season}
      divisions={(divisions ?? []) as Division[]}
      venues={venues ?? []}
    />
  );
}
