// One-tap welcome link. The link carries a long random token; the person only
// picks a password. We verify the token, create or update their account with
// the right role, set the password, and the app signs them in with it.
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

  let body: { token?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const token = String(body.token || "").trim();
  const password = String(body.password || "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return json({ error: "This link isn't right. Ask Clutch for a fresh one." }, 400);
  if (password.length < 8) return json({ error: "Password needs at least 8 characters" }, 400);

  const { data: failures } = await admin.rpc("recent_failures", { p_ip: ip, p_kind: "setup" });
  if ((failures ?? 0) >= 10) return json({ error: "Too many tries. Wait 15 minutes." }, 429);

  const { data: match, error: mErr } = await admin.rpc("match_setup_token", { p_token: token });
  if (mErr) return json({ error: "Something went wrong" }, 500);
  if (!match || !match.id) {
    await admin.from("auth_attempts").insert({ ip, kind: "setup" });
    return json({ error: "This link has already been used or has expired. Message Clutch for a fresh one." }, 401);
  }

  const email = String(match.email).trim().toLowerCase();
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
    // admin: may also be a coach. Link the coach row with the same email if there is one.
    const { data: c } = await admin.from("coaches").select("id,name").ilike("email", email).maybeSingle();
    if (c) { meta.coach_id = c.id; fullName = c.name; }
    if (match.target_id) {
      const { data: c2 } = await admin.from("coaches").select("id,name").eq("id", match.target_id).maybeSingle();
      if (c2) { meta.coach_id = c2.id; fullName = c2.name; }
    }
  }
  meta.full_name = fullName;

  const { data: existingId } = await admin.rpc("user_id_by_email", { p_email: email });
  let userId: string = existingId ?? "";
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password, email_confirm: true, app_metadata: meta });
    if (error) return json({ error: "Couldn't update the account: " + error.message }, 500);
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: meta });
    if (error || !data.user) return json({ error: "Couldn't create the account: " + (error?.message ?? "") }, 500);
    userId = data.user.id;
  }
  // The auth trigger can fire before the metadata lands, so link the profile ourselves.
  const { error: pErr } = await admin.from("profiles").upsert({
    id: userId, role: meta.role, full_name: fullName,
    coach_id: meta.coach_id ?? null, guardian_id: meta.guardian_id ?? null, player_id: null,
  });
  if (pErr) return json({ error: "Couldn't link the account: " + pErr.message }, 500);

  if (meta.guardian_id) await admin.from("guardians").update({ profile_id: userId }).eq("id", meta.guardian_id);
  if (meta.coach_id) await admin.from("coaches").update({ profile_id: userId }).eq("id", meta.coach_id);
  await admin.from("setup_links").update({ used_at: new Date().toISOString() }).eq("id", match.id);

  return json({ ok: true, email, role: meta.role, name: fullName });
});
