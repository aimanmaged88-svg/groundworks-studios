"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getClubContext } from "@/lib/club";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const dob = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .nullable();

export type Sensitive = { medical: string | null; ambulance_cover: string | null; emergency_name: string | null; emergency_phone: string | null; emergency_relationship: string | null; updated_at: string };

/** Audited read: the database writes an audit_log row for every call. */
export async function getSensitiveAction(personId: string): Promise<Result<{ sensitive: Sensitive | null }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_person_sensitive", { p_person_id: personId });
  if (error) return { ok: false, error: error.code === "42501" ? "You don't have access to these details." : error.message };
  return { ok: true, sensitive: (data?.[0] as Sensitive | undefined) ?? null };
}

export async function saveSensitiveAction(slug: string, personId: string, input: { medical: string; ambulance_cover: string; emergency_name: string; emergency_phone: string; emergency_relationship: string }): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("upsert_person_sensitive", {
    p_person_id: personId,
    p_medical: input.medical,
    p_ambulance_cover: input.ambulance_cover,
    p_emergency_name: input.emergency_name,
    p_emergency_phone: input.emergency_phone,
    p_emergency_relationship: input.emergency_relationship,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

export async function savePersonAction(slug: string, personId: string, input: { first_name: string; last_name: string; dob: string | null; gender: string | null; school: string | null }): Promise<Result> {
  const parsed = z.object({ first_name: z.string().trim().min(1), last_name: z.string().trim(), dob, gender: z.string().nullable(), school: z.string().nullable() }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the name and date of birth." };
  const supabase = await createClient();
  const { error } = await supabase.from("people").update({ ...parsed.data, dob: parsed.data.dob || null, gender: parsed.data.gender || null, school: parsed.data.school || null }).eq("id", personId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

export async function saveGuardianAction(slug: string, guardianId: string, input: { first_name: string; last_name: string; mobile: string | null; email: string | null }): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("people")
    .update({ first_name: input.first_name.trim(), last_name: input.last_name.trim(), mobile: input.mobile || null, email: input.email?.trim().toLowerCase() || null })
    .eq("id", guardianId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

export async function saveRegistrationAction(
  slug: string,
  registrationId: string,
  input: { uniform_size: string | null; experience: string | null; heard_via: string | null; notes: string | null; status: "new" | "reviewed" | "placed" | "withdrawn" },
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("registrations")
    .update({ uniform_size: input.uniform_size || null, experience: input.experience || null, heard_via: input.heard_via || null, notes: input.notes || null, status: input.status })
    .eq("id", registrationId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

export async function archivePersonAction(slug: string, personId: string, archived: boolean): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("people").update({ archived_at: archived ? new Date().toISOString() : null, archived_by: archived ? user!.id : null }).eq("id", personId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

export async function setFeeAction(slug: string, personId: string, status: "owing" | "partial" | "paid" | "waived"): Promise<Result> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return { ok: false, error: "Admins only." };
  const supabase = await createClient();
  const { data: existing } = ctx.season ? await supabase.from("fees").select("id").eq("person_id", personId).eq("season_id", ctx.season.id).maybeSingle() : { data: null };
  if (existing) {
    const { error } = await supabase.from("fees").update({ status }).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    if (!ctx.season) return { ok: false, error: "Set up a season first." };
    const { error } = await supabase.from("fees").insert({ club_id: ctx.club.id, season_id: ctx.season.id, person_id: personId, amount_cents: ctx.season.fee_cents ?? 0, status });
    if (error) return { ok: false, error: error.message };
  }
  revalidatePath(`/app/${slug}/members`);
  return { ok: true };
}

const addSchema = z.object({
  player: z.object({ first_name: z.string().trim().min(1, { error: "First name is required." }), last_name: z.string().trim(), dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Date of birth is required." }), gender: z.string().optional(), school: z.string().optional() }),
  guardian: z.object({ first_name: z.string().trim(), last_name: z.string().trim(), email: z.string().trim().optional(), mobile: z.string().trim().optional(), relationship: z.string().optional() }),
  sensitive: z.object({ medical: z.string().optional(), ambulance_cover: z.string().optional(), emergency_name: z.string().optional(), emergency_phone: z.string().optional() }),
  registration: z.object({ uniform_size: z.string().optional(), experience: z.string().optional(), heard_via: z.string().optional(), notes: z.string().optional() }),
});

/** Admin adds a player by hand: same atomic path as the public form, with source = admin. */
export async function addPlayerAction(slug: string, input: z.input<typeof addSchema>): Promise<Result<{ id: string }>> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return { ok: false, error: "Admins only." };
  const parsed = addSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  const admin = createAdminClient();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: id, error } = await admin.rpc("submit_registration", { p_club_slug: slug, p_payload: { ...parsed.data, consents: [] }, p_source: "admin" });
  if (error) return { ok: false, error: error.message };
  await admin.from("audit_log").insert({ club_id: ctx.club.id, actor_user_id: user!.id, action: "registration.add_by_admin", target_table: "registrations", target_id: id });
  revalidatePath(`/app/${slug}/members`);
  return { ok: true, id };
}
