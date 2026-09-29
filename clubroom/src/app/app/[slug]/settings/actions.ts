"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isHex } from "@/lib/colours";
import { publicEnv } from "@/lib/env";
import { inviteEmail, sendEmail } from "@/lib/email";
import { getClubContext } from "@/lib/club";
import { createClient } from "@/lib/supabase/server";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

export async function updateClubAction(
  slug: string,
  input: {
    name: string;
    short_name: string;
    suburb: string;
    state: string;
    contact_email: string;
    contact_phone: string;
    instagram_handle: string;
    website: string;
    primary: string;
    accent: string;
    on_primary: string;
    theme_default: "dark" | "light";
    logo_path: string | null;
    public_page: { headline: string; blurb: string; cta: string; when: string; where: string };
  },
): Promise<Result> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return { ok: false, error: "Admins only." };
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(80),
      short_name: z.string().trim().max(24),
      suburb: z.string().trim().max(80),
      state: z.string().trim().max(10),
      contact_email: z.union([z.literal(""), z.email()]),
      contact_phone: z.string().trim().max(30),
      instagram_handle: z.string().trim().max(60),
      website: z.union([z.literal(""), z.url()]),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the details." };
  if (!isHex(input.primary) || !isHex(input.accent) || !isHex(input.on_primary)) return { ok: false, error: "Colours must be hex values like #1a73e8." };
  const supabase = await createClient();
  const d = parsed.data;
  const { error } = await supabase
    .from("clubs")
    .update({
      name: d.name,
      short_name: d.short_name || null,
      suburb: d.suburb || null,
      state: d.state || null,
      contact_email: d.contact_email || null,
      contact_phone: d.contact_phone || null,
      instagram_handle: d.instagram_handle.replace(/^@/, "") || null,
      website: d.website || null,
      colours: { primary: input.primary, accent: input.accent, on_primary: input.on_primary },
      theme_default: input.theme_default,
      logo_path: input.logo_path,
      public_page: Object.fromEntries(Object.entries(input.public_page).map(([k, v]) => [k, v.trim() || undefined])),
    })
    .eq("id", ctx.club.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}`, "layout");
  revalidatePath(`/c/${slug}`, "layout");
  return { ok: true };
}

const fieldSchema = z.object({
  key: z.string().regex(/^[a-z0-9_]{1,40}$/),
  label: z.string().trim().min(1).max(80),
  type: z.enum(["text", "tel", "email", "date", "select", "textarea", "checkbox"]),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  section: z.enum(["player", "guardian", "medical", "extra"]),
  maps_to: z.string().optional(),
  help: z.string().max(200).optional(),
  enabled: z.boolean().optional(),
});
const consentSchema = z.object({ key: z.string().regex(/^[a-z0-9_]{1,40}$/), label: z.string().trim().min(1).max(80), text: z.string().trim().min(1).max(600), required: z.boolean().optional() });

/** Saves the registration form as a new version so old consents keep pointing at the wording they were given with. */
export async function saveFormTemplateAction(slug: string, input: { intro: string; collection_notice: string; fields: z.infer<typeof fieldSchema>[]; consents: z.infer<typeof consentSchema>[] }): Promise<Result<{ version: number }>> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return { ok: false, error: "Admins only." };
  const parsed = z.object({ intro: z.string().max(600), collection_notice: z.string().max(1500), fields: z.array(fieldSchema).min(1).max(60), consents: z.array(consentSchema).max(12) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the form." };
  const required = ["player.first_name", "player.dob", "guardian.email"];
  for (const r of required) {
    const f = parsed.data.fields.find((x) => x.maps_to === r);
    if (!f || f.enabled === false || !f.required) return { ok: false, error: `The ${r === "player.first_name" ? "player's first name" : r === "player.dob" ? "date of birth" : "parent's email"} must stay on and required.` };
  }
  const keys = new Set<string>();
  for (const f of parsed.data.fields) {
    if (keys.has(f.key)) return { ok: false, error: `Two fields share the key "${f.key}".` };
    keys.add(f.key);
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: current } = await supabase.from("form_templates").select("id, version").eq("club_id", ctx.club.id).eq("is_active", true).maybeSingle();
  const version = (current?.version ?? 0) + 1;
  if (current) await supabase.from("form_templates").update({ is_active: false }).eq("id", current.id);
  const { error } = await supabase.from("form_templates").insert({
    club_id: ctx.club.id,
    version,
    intro: parsed.data.intro.trim() || null,
    collection_notice: parsed.data.collection_notice.trim() || null,
    fields: parsed.data.fields,
    consents: parsed.data.consents,
    is_active: true,
    published_at: new Date().toISOString(),
    created_by: user!.id,
  });
  if (error) {
    if (current) await supabase.from("form_templates").update({ is_active: true }).eq("id", current.id);
    return { ok: false, error: error.message };
  }
  revalidatePath(`/app/${slug}/settings/form`);
  revalidatePath(`/c/${slug}/register`);
  return { ok: true, version };
}

export async function inviteAction(slug: string, input: { email: string; role: "admin" | "coach"; first_name?: string; last_name?: string }): Promise<Result<{ link: string; sent: boolean }>> {
  const ctx = await getClubContext(slug);
  if (!ctx.isAdmin) return { ok: false, error: "Admins only." };
  const email = z.email().safeParse(input.email.trim().toLowerCase());
  if (!email.success) return { ok: false, error: "Enter a valid email." };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let personId: string | undefined;
  if (input.role === "coach") {
    // A coach gets a staff person row now, so they can be put on a team before they've logged in.
    const { data: existing } = await supabase.from("people").select("id").eq("club_id", ctx.club.id).eq("kind", "staff").eq("email", email.data).maybeSingle();
    if (existing) personId = existing.id;
    else {
      const { data: p, error } = await supabase.from("people").insert({ club_id: ctx.club.id, kind: "staff", first_name: input.first_name?.trim() || email.data.split("@")[0], last_name: input.last_name?.trim() || "", email: email.data }).select("id").single();
      if (error) return { ok: false, error: error.message };
      personId = p.id;
    }
  }
  const { data: token, error } = await supabase.rpc("create_invite", { p_club: ctx.club.id, p_email: email.data, p_role: input.role, p_person_id: personId });
  if (error) return { ok: false, error: error.message };
  const link = `${publicEnv.appUrl()}/invite/${token}`;
  const { data: profile } = await supabase.from("user_profiles").select("full_name").eq("user_id", user!.id).maybeSingle();
  let sent = false;
  try {
    sent = (await sendEmail({ to: email.data, ...inviteEmail({ clubName: ctx.club.name, role: input.role, inviterName: profile?.full_name ?? null, link }) })).sent;
  } catch {
    sent = false;
  }
  revalidatePath(`/app/${slug}/settings/people`);
  return { ok: true, link, sent };
}

export async function revokeInviteAction(slug: string, inviteId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("invites").delete().eq("id", inviteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/settings/people`);
  return { ok: true };
}

export async function removeMemberAction(slug: string, clubUserId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("club_users").delete().eq("id", clubUserId);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/app/${slug}/settings/people`);
  return { ok: true };
}
