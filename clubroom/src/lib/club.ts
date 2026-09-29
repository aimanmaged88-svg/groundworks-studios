import { notFound } from "next/navigation";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Colours } from "@/app/start/wizard";

export type ClubRole = "admin" | "coach" | "parent" | "player";

export type ClubContext = {
  club: {
    id: string;
    slug: string;
    name: string;
    short_name: string | null;
    sport_key: string;
    logo_path: string | null;
    colours: Colours;
    theme_default: "dark" | "light" | "system";
    timezone: string;
    is_demo: boolean;
    status: "onboarding" | "active" | "suspended" | "closed";
    suburb: string | null;
    state: string | null;
    instagram_handle: string | null;
    website: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    public_page: Record<string, unknown>;
    settings: Record<string, unknown>;
  };
  roles: ClubRole[];
  isAdmin: boolean;
  isPlatformOwner: boolean;
  vocabulary: Record<string, string>;
  season: {
    id: string;
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    age_rule_mode: "birth_year" | "age_at_date";
    age_cutoff_date: string | null;
    fee_cents: number | null;
    fee_label: string | null;
    registration_open: boolean;
  } | null;
  subscription: { plan: string; status: string; trial_ends_at: string | null; member_limit: number; current_period_end: string | null; stripe_customer_id: string | null } | null;
};

/**
 * Loads the club for the signed-in user. RLS makes the club invisible to
 * non-members, which turns into a 404 rather than a leak.
 */
export const getClubContext = cache(async (slug: string): Promise<ClubContext> => {
  const supabase = await createClient();
  const { data: club } = await supabase
    .from("clubs")
    .select(
      "id, slug, name, short_name, sport_key, logo_path, colours, theme_default, timezone, is_demo, status, suburb, state, instagram_handle, website, contact_email, contact_phone, public_page, settings, sports(vocabulary)",
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!club) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: memberships }, { data: owner }, { data: season }, { data: subscription }] = await Promise.all([
    supabase.from("club_users").select("role").eq("club_id", club.id).eq("user_id", user!.id).eq("status", "active"),
    supabase.from("platform_users").select("user_id").eq("user_id", user!.id).maybeSingle(),
    supabase.from("seasons").select("id, name, starts_on, ends_on, age_rule_mode, age_cutoff_date, fee_cents, fee_label, registration_open").eq("club_id", club.id).eq("is_current", true).maybeSingle(),
    supabase.from("subscriptions").select("plan, status, trial_ends_at, member_limit, current_period_end, stripe_customer_id").eq("club_id", club.id).maybeSingle(),
  ]);
  const roles = (memberships ?? []).map((m) => m.role as ClubRole);
  const isPlatformOwner = !!owner;
  const sportVocab = ((club.sports as { vocabulary: Record<string, string> } | null)?.vocabulary ?? {}) as Record<string, string>;
  const settings = (club.settings ?? {}) as Record<string, unknown>;
  const vocabulary = { ...sportVocab, ...((settings.vocabulary as Record<string, string> | undefined) ?? {}) };

  return {
    club: {
      ...club,
      colours: (club.colours as Colours | null) ?? { primary: "#f2b705", accent: "#f2b705", on_primary: "#14120a" },
      public_page: (club.public_page ?? {}) as Record<string, unknown>,
      settings,
    },
    roles,
    isAdmin: roles.includes("admin") || isPlatformOwner,
    isPlatformOwner,
    vocabulary,
    season: season ?? null,
    subscription: subscription ?? null,
  };
});

export function requireAdmin(ctx: ClubContext) {
  if (!ctx.isAdmin) notFound();
}
