import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Wizard, type Colours, type WizardData } from "./wizard";

export const metadata: Metadata = { title: "Set up your club" };

export default async function StartPage({ searchParams }: { searchParams: Promise<{ club?: string; step?: string }> }) {
  const user = await requireUser("/start");
  const { club: clubParam, step: stepParam } = await searchParams;
  const supabase = await createClient();

  const { data: sports } = await supabase.from("sports").select("key, name, default_divisions").order("sort");

  // Resume the club being set up (the newest one still onboarding that I admin).
  let clubQuery = supabase
    .from("clubs")
    .select("id, slug, name, sport_key, suburb, state, logo_path, colours, theme_default, short_name, instagram_handle, status, onboarding_step")
    .eq("status", "onboarding")
    .order("created_at", { ascending: false })
    .limit(1);
  if (clubParam) clubQuery = supabase.from("clubs").select("id, slug, name, sport_key, suburb, state, logo_path, colours, theme_default, short_name, instagram_handle, status, onboarding_step").eq("id", clubParam).limit(1);
  const { data: clubs } = await clubQuery;
  const club = clubs?.[0] ?? null;
  if (club && club.status === "active") redirect(`/app/${club.slug}`);

  let venues: WizardData["venues"] = [];
  let season: WizardData["season"] = null;
  let divisions: WizardData["divisions"] = [];
  let invites: WizardData["invites"] = [];
  if (club) {
    const [v, s, inv] = await Promise.all([
      supabase.from("venues").select("id, name, address").eq("club_id", club.id).order("created_at"),
      supabase.from("seasons").select("id, name, starts_on, ends_on, age_rule_mode, age_cutoff_date, fee_cents, fee_label, registration_open").eq("club_id", club.id).eq("is_current", true).maybeSingle(),
      supabase.from("invites").select("email, role, accepted_at").eq("club_id", club.id).order("created_at"),
    ]);
    venues = v.data ?? [];
    season = s.data ?? null;
    invites = inv.data ?? [];
    if (season) {
      const { data: d } = await supabase.from("divisions").select("name, sort, gender, born_from, born_to, min_age, max_age").eq("season_id", season.id).order("sort");
      divisions = d ?? [];
    }
  }

  const { data: profile } = await supabase.from("user_profiles").select("full_name").eq("user_id", user.id).maybeSingle();

  const data: WizardData = {
    club: club ? { ...club, colours: (club.colours as Colours | null) ?? { primary: "#f2b705", accent: "#f2b705", on_primary: "#14120a" } } : null,
    sports: (sports ?? []).map((s) => ({ key: s.key, name: s.name, default_divisions: (s.default_divisions as Array<{ name: string; min_age?: number | null; max_age?: number | null }>) ?? [] })),
    venues,
    season,
    divisions,
    invites,
    userName: profile?.full_name ?? null,
    userEmail: user.email ?? "",
    initialStep: stepParam ? Number(stepParam) : undefined,
  };

  return <Wizard data={data} />;
}
