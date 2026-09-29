import { cache } from "react";
import { createClient as createAnonClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";
import type { Colours } from "@/app/start/wizard";
import type { Division } from "@/lib/age-rule";
import { subscriptionAllowsUse } from "@/lib/plans";

export type FormField = {
  key: string;
  label: string;
  type: "text" | "tel" | "email" | "date" | "select" | "textarea" | "checkbox";
  required?: boolean;
  options?: string[];
  section: "player" | "guardian" | "medical" | "extra";
  maps_to?: string;
  help?: string;
  enabled?: boolean;
};

export type FormConsent = { key: string; label: string; text: string; required?: boolean };

export type PublicClub = {
  club: {
    slug: string;
    name: string;
    short_name: string | null;
    sport_key: string;
    logo_path: string | null;
    colours: Colours;
    theme_default: "dark" | "light" | "system";
    public_page: { headline?: string; blurb?: string; cta?: string; hero_path?: string; when?: string; where?: string };
    suburb: string | null;
    state: string | null;
    instagram_handle: string | null;
    website: string | null;
    is_demo: boolean;
    timezone: string;
    contact_email: string | null;
    contact_phone: string | null;
    vocabulary: Record<string, string>;
  };
  form: { id: string; version: number; intro: string | null; collection_notice: string | null; fields: FormField[]; consents: FormConsent[] } | null;
  season: {
    id: string;
    name: string;
    starts_on: string | null;
    fee_cents: number | null;
    fee_label: string | null;
    registration_open: boolean;
    age_rule_mode: "birth_year" | "age_at_date";
    age_cutoff_date: string | null;
    divisions: Division[];
  } | null;
  billing: { status: string; trial_ends_at: string | null } | null;
};

/** Registrations are open only when the season says so and the club's plan or trial allows it. */
export function registrationsOpen(data: PublicClub) {
  return !!data.form && !!data.season?.registration_open && subscriptionAllowsUse(data.billing);
}

/** Everything the public pages need, fetched as anon through the RPC (no session, no cookies). */
export const getPublicClub = cache(async (slug: string): Promise<PublicClub | null> => {
  const supabase = createAnonClient<Database>(publicEnv.supabaseUrl(), publicEnv.supabaseAnonKey(), { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc("get_public_form", { p_slug: slug });
  if (error || !data) return null;
  return data as unknown as PublicClub;
});
