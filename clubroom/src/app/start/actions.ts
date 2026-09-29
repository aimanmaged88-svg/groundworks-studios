"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { publicEnv } from "@/lib/env";
import { inviteEmail, sendEmail } from "@/lib/email";
import { isHex } from "@/lib/colours";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const slugSchema = z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$/, { error: "Use letters, numbers and dashes only (3 to 40 characters)." });

export async function checkSlug(slug: string): Promise<{ available: boolean; slug: string }> {
  const clean = slugify(slug);
  if (!slugSchema.safeParse(clean).success) return { available: false, slug: clean };
  const admin = createAdminClient();
  const { data } = await admin.from("clubs").select("id").eq("slug", clean).maybeSingle();
  return { available: !data, slug: clean };
}

export async function createClubAction(input: { name: string; sport_key: string; slug: string; suburb?: string; state?: string }): Promise<Result<{ clubId: string; slug: string }>> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, { error: "Give the club a name." }).max(80),
      sport_key: z.string().min(1, { error: "Pick a sport." }),
      slug: slugSchema,
      suburb: z.string().trim().max(80).optional(),
      state: z.string().trim().max(10).optional(),
    })
    .safeParse({ ...input, slug: slugify(input.slug) });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };

  const supabase = await createClient();
  const { data: clubId, error } = await supabase.rpc("create_club", { p_name: parsed.data.name, p_slug: parsed.data.slug, p_sport_key: parsed.data.sport_key });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That web address is taken. Try another." };
    return { ok: false, error: error.message };
  }
  await supabase.from("clubs").update({ suburb: parsed.data.suburb || null, state: parsed.data.state || null, onboarding_step: 1 }).eq("id", clubId);
  return { ok: true, clubId, slug: parsed.data.slug };
}

export async function updateClubBasicsAction(clubId: string, input: { name: string; sport_key: string; suburb?: string; state?: string }): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({ name: input.name.trim(), sport_key: input.sport_key, suburb: input.suburb || null, state: input.state || null })
    .eq("id", clubId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function saveLookAction(
  clubId: string,
  input: { logo_path: string | null; primary: string; accent: string; on_primary: string; theme_default: "dark" | "light"; short_name?: string; instagram_handle?: string },
): Promise<Result> {
  if (!isHex(input.primary) || !isHex(input.accent) || !isHex(input.on_primary)) return { ok: false, error: "Colours must be hex values like #1a73e8." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({
      logo_path: input.logo_path,
      colours: { primary: input.primary, accent: input.accent, on_primary: input.on_primary },
      theme_default: input.theme_default,
      short_name: input.short_name?.trim() || null,
      instagram_handle: input.instagram_handle?.replace(/^@/, "").trim() || null,
    })
    .eq("id", clubId);
  if (error) return { ok: false, error: error.message };
  await bumpStep(clubId, 2);
  return { ok: true };
}

export async function saveVenuesAction(clubId: string, venues: Array<{ id?: string; name: string; address?: string }>): Promise<Result<{ venues: Array<{ id: string; name: string; address: string | null }> }>> {
  const supabase = await createClient();
  const clean = venues.map((v) => ({ id: v.id, name: v.name.trim(), address: v.address?.trim() || null })).filter((v) => v.name);
  const keepIds = clean.map((v) => v.id).filter(Boolean) as string[];
  const { data: existing } = await supabase.from("venues").select("id").eq("club_id", clubId);
  const toDelete = (existing ?? []).map((v) => v.id).filter((id) => !keepIds.includes(id));
  if (toDelete.length) await supabase.from("venues").delete().in("id", toDelete);
  const out: Array<{ id: string; name: string; address: string | null }> = [];
  for (const v of clean) {
    if (v.id) {
      const { data, error } = await supabase.from("venues").update({ name: v.name, address: v.address }).eq("id", v.id).select("id, name, address").single();
      if (error) return { ok: false, error: error.message };
      out.push(data);
    } else {
      const { data, error } = await supabase.from("venues").insert({ club_id: clubId, name: v.name, address: v.address }).select("id, name, address").single();
      if (error) return { ok: false, error: error.message };
      out.push(data);
    }
  }
  await bumpStep(clubId, 3);
  return { ok: true, venues: out };
}

const divisionSchema = z.object({
  name: z.string().trim().min(1).max(30),
  sort: z.number().int(),
  gender: z.string().nullable().optional(),
  born_from: z.number().int().nullable().optional(),
  born_to: z.number().int().nullable().optional(),
  min_age: z.number().int().min(0).max(120).nullable().optional(),
  max_age: z.number().int().min(0).max(120).nullable().optional(),
});

export async function saveSeasonAction(
  clubId: string,
  input: {
    name: string;
    starts_on: string | null;
    ends_on: string | null;
    age_rule_mode: "birth_year" | "age_at_date";
    age_cutoff_date: string | null;
    registration_open: boolean;
    divisions: z.infer<typeof divisionSchema>[];
  },
): Promise<Result<{ seasonId: string }>> {
  const parsed = z
    .object({
      name: z.string().trim().min(2, { error: "Name the season." }).max(60),
      starts_on: z.string().nullable(),
      ends_on: z.string().nullable(),
      age_rule_mode: z.enum(["birth_year", "age_at_date"]),
      age_cutoff_date: z.string().nullable(),
      registration_open: z.boolean(),
      divisions: z.array(divisionSchema).min(1, { error: "Add at least one age group." }),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the season details." };
  const d = parsed.data;
  if (d.age_rule_mode === "age_at_date" && !d.age_cutoff_date) return { ok: false, error: "Pick the date ages are counted at." };

  const supabase = await createClient();
  const { data: current } = await supabase.from("seasons").select("id").eq("club_id", clubId).eq("is_current", true).maybeSingle();
  const seasonRow = {
    club_id: clubId,
    name: d.name,
    starts_on: d.starts_on || null,
    ends_on: d.ends_on || null,
    age_rule_mode: d.age_rule_mode,
    age_cutoff_date: d.age_rule_mode === "age_at_date" ? d.age_cutoff_date : null,
    registration_open: d.registration_open,
    is_current: true,
  };
  let seasonId: string;
  if (current) {
    const { error } = await supabase.from("seasons").update(seasonRow).eq("id", current.id);
    if (error) return { ok: false, error: error.message };
    seasonId = current.id;
  } else {
    const { data, error } = await supabase.from("seasons").insert(seasonRow).select("id").single();
    if (error) return { ok: false, error: error.message };
    seasonId = data.id;
  }
  await supabase.from("divisions").delete().eq("season_id", seasonId);
  const { error: divErr } = await supabase.from("divisions").insert(
    d.divisions.map((dv, i) => ({
      club_id: clubId,
      season_id: seasonId,
      name: dv.name,
      sort: i + 1,
      gender: dv.gender ?? null,
      born_from: d.age_rule_mode === "birth_year" ? (dv.born_from ?? null) : null,
      born_to: d.age_rule_mode === "birth_year" ? (dv.born_to ?? null) : null,
      min_age: d.age_rule_mode === "age_at_date" ? (dv.min_age ?? null) : null,
      max_age: d.age_rule_mode === "age_at_date" ? (dv.max_age ?? null) : null,
    })),
  );
  if (divErr) return { ok: false, error: divErr.message };
  await bumpStep(clubId, 4);
  return { ok: true, seasonId };
}

export async function saveFeeAction(clubId: string, input: { mode: "set" | "later"; amount: string; label: string }): Promise<Result> {
  const supabase = await createClient();
  const { data: season } = await supabase.from("seasons").select("id").eq("club_id", clubId).eq("is_current", true).maybeSingle();
  if (!season) return { ok: false, error: "Set up the season first." };
  let fee_cents: number | null = null;
  if (input.mode === "set") {
    const n = Number(String(input.amount).replace(/[^0-9.]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return { ok: false, error: "Enter the fee in dollars, like 180." };
    fee_cents = Math.round(n * 100);
  }
  const { error } = await supabase.from("seasons").update({ fee_cents, fee_label: input.label.trim() || null }).eq("id", season.id);
  if (error) return { ok: false, error: error.message };
  await bumpStep(clubId, 5);
  return { ok: true };
}

export async function inviteAdminsAction(clubId: string, emails: string[]): Promise<Result<{ invites: Array<{ email: string; link: string; sent: boolean }> }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: club } = await supabase.from("clubs").select("name").eq("id", clubId).single();
  const { data: profile } = await supabase.from("user_profiles").select("full_name").eq("user_id", user!.id).maybeSingle();
  const list = [...new Set(emails.map((e) => e.trim().toLowerCase()).filter((e) => z.email().safeParse(e).success))];
  const invites: Array<{ email: string; link: string; sent: boolean }> = [];
  for (const email of list) {
    const { data: token, error } = await supabase.rpc("create_invite", { p_club: clubId, p_email: email, p_role: "admin" });
    if (error) return { ok: false, error: error.message };
    const link = `${publicEnv.appUrl()}/invite/${token}`;
    let sent = false;
    try {
      sent = (await sendEmail({ to: email, ...inviteEmail({ clubName: club?.name ?? "Your club", role: "admin", inviterName: profile?.full_name ?? null, link }) })).sent;
    } catch {
      sent = false;
    }
    invites.push({ email, link, sent });
  }
  await bumpStep(clubId, 6);
  return { ok: true, invites };
}

export async function skipStepAction(clubId: string, step: number): Promise<Result> {
  await bumpStep(clubId, step);
  return { ok: true };
}

export async function goLiveAction(clubId: string): Promise<Result> {
  const supabase = await createClient();
  const { data: club, error } = await supabase.from("clubs").update({ status: "active", onboarding_step: 7 }).eq("id", clubId).select("slug").single();
  if (error) return { ok: false, error: error.message };
  await supabase.rpc("my_clubs"); // warms nothing; keeps the call shape honest for RLS
  redirect(`/app/${club.slug}?welcome=1`);
}

async function bumpStep(clubId: string, step: number) {
  const supabase = await createClient();
  const { data } = await supabase.from("clubs").select("onboarding_step").eq("id", clubId).single();
  if ((data?.onboarding_step ?? 0) < step) await supabase.from("clubs").update({ onboarding_step: step }).eq("id", clubId);
}
