// First sign-in for a parent, coach or admin: email + the code Clutch sent them + a password they choose.
// Creates (or updates) the auth account with the right role, links it to the guardian/coach row,
// and burns the code. The client then signs in with email + password as normal.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  let body: { email?: string; code?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim().toUpperCase();
  const password = String(body.password || "");
  if (!email || !code) return json({ error: "Email and code are needed" }, 400);
  if (password.length < 8) return json({ error: "Password needs at least 8 characters" }, 400);

  const { data: failures } = await admin.rpc("recent_failures", { p_ip: ip, p_kind: "activate" });
  if ((failures ?? 0) >= 10) return json({ error: "Too many tries. Wait 15 minutes." }, 429);

  const { data: match, error: mErr } = await admin.rpc("match_activation", { p_email: email, p_code: code });
  if (mErr) return json({ error: "Something went wrong" }, 500);
  if (!match || !match.id) {
    await admin.from("auth_attempts").insert({ ip, kind: "activate" });
    return json({ error: "That email and code don't match, or the code has expired. Ask Clutch for a new one." }, 401);
  }

  // Work out the role and who this account belongs to.
  const meta: Record<string, string> = { role: match.kind === "guardian" ? "parent" : match.kind };
  let fullName = "";
  if (match.kind === "guardian") {
    const { data: g } = await admin.from("guardians").select("id,name").eq("id", match.target_id).single();
    if (!g) return json({ error: "This family record no longer exists" }, 410);
    meta.guardian_id = g.id; fullName = g.name;
  } else if (match.kind === "coach") {
    const { data: c } = await admin.from("coaches").select("id,name").eq("id", match.target_id).single();
    if (!c) return json({ error: "This coach record no longer exists" }, 410);
    meta.coach_id = c.id; fullName = c.name;
  } else {
    // admin: may also be a coach (Camille). Link the coach row with the same email if there is one.
    const { data: c } = await admin.from("coaches").select("id,name").ilike("email", email).maybeSingle();
    if (c) { meta.coach_id = c.id; fullName = c.name; }
    if (match.target_id) {
      const { data: c2 } = await admin.from("coaches").select("id,name").eq("id", match.target_id).maybeSingle();
      if (c2) { meta.coach_id = c2.id; fullName = c2.name; }
    }
  }
  meta.full_name = fullName;

  // Create or update the auth user. No email is sent: the code already proved who they are.
  const { data: existingId } = await admin.rpc("user_id_by_email", { p_email: email });
  let userId: string = existingId ?? "";
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true, app_metadata: meta });
    if (error) return json({ error: "Couldn't update the account: " + error.message }, 500);
    const { error: pErr } = await admin.from("profiles").upsert({
      id: userId, role: meta.role, full_name: fullName,
      coach_id: meta.coach_id ?? null, guardian_id: meta.guardian_id ?? null, player_id: null,
    });
    if (pErr) return json({ error: "Couldn't link the account: " + pErr.message }, 500);
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: meta });
    if (error || !data.user) return json({ error: "Couldn't create the account: " + (error?.message ?? "") }, 500);
    userId = data.user.id;
    // The auth trigger can fire before the metadata lands, so link the profile ourselves.
    const { error: pErr } = await admin.from("profiles").upsert({
      id: userId, role: meta.role, full_name: fullName,
      coach_id: meta.coach_id ?? null, guardian_id: meta.guardian_id ?? null, player_id: null,
    });
    if (pErr) return json({ error: "Couldn't link the account: " + pErr.message }, 500);
  }

  if (meta.guardian_id) await admin.from("guardians").update({ profile_id: userId }).eq("id", meta.guardian_id);
  if (meta.coach_id) await admin.from("coaches").update({ profile_id: userId }).eq("id", meta.coach_id);
  await admin.from("activation_codes").update({ used_at: new Date().toISOString() }).eq("id", match.id);

  return json({ ok: true, role: meta.role, name: fullName });
});
