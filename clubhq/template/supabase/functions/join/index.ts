// Self-onboarding. An admin-minted invite link carries a token; the coach or
// the family fills in their own details here. We verify the token, create the
// rows and the account, and the app signs them in with the password they chose.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, max = 120) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const token = clean(body.token, 64);
  const password = String(body.password || "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return json({ error: "This link isn't right. Ask {{CLUB_SHORT}} for a fresh one." }, 400);
  if (password.length < 8) return json({ error: "Password needs at least 8 characters" }, 400);

  const { data: failures } = await admin.rpc("recent_failures", { p_ip: ip, p_kind: "join" });
  if ((failures ?? 0) >= 10) return json({ error: "Too many tries. Wait 15 minutes." }, 429);

  const { data: inv, error: mErr } = await admin.rpc("match_invite", { p_token: token });
  if (mErr) return json({ error: "Something went wrong" }, 500);
  if (!inv || !inv.id) {
    await admin.from("auth_attempts").insert({ ip, kind: "join" });
    return json({ error: "This invite has already been used or has expired. Ask {{CLUB_SHORT}} for a fresh one." }, 401);
  }

  const email = clean(body.email).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "That email doesn't look right" }, 400);
  const { data: existing } = await admin.rpc("user_id_by_email", { p_email: email });
  if (existing) return json({ error: "That email already has a {{CLUB_SHORT}} account. Sign in instead — or tap Forgot password." }, 409);

  let meta: Record<string, string>;
  let fullName = "";
  if (inv.kind === "coach") {
    const name = clean(body.name);
    const phone = clean(body.phone, 30);
    if (!name || !phone) return json({ error: "Name and mobile are needed" }, 400);
    const { data: c, error } = await admin.from("coaches").insert({
      name, phone, email, role: "Coach",
      wwcc_no: clean(body.wwcc_no, 40), wwcc_exp: clean(body.wwcc_exp, 10) || null,
    }).select().single();
    if (error || !c) return json({ error: "Couldn't save the coach: " + (error?.message ?? "") }, 500);
    meta = { role: "coach", coach_id: c.id }; fullName = name;
  } else {
    const gname = clean(body.gname);
    const gphone = clean(body.gphone, 30);
    const first = clean(body.first, 60), last = clean(body.last, 60);
    const dob = clean(body.dob, 10);
    if (!gname || !gphone || !first || !last) return json({ error: "Parent and player names and the parent's mobile are needed" }, 400);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return json({ error: "The player's date of birth is needed" }, 400);
    const { data: fam, error: fErr } = await admin.from("families").insert({ name: last + " family" }).select().single();
    if (fErr || !fam) return json({ error: "Couldn't save the family" }, 500);
    const { data: g, error: gErr } = await admin.from("guardians").insert({
      family_id: fam.id, name: gname, rel: clean(body.grel, 20) || "Guardian", phone: gphone, email,
    }).select().single();
    if (gErr || !g) return json({ error: "Couldn't save the parent" }, 500);
    const { error: pErr } = await admin.from("players").insert({
      family_id: fam.id, first_name: first, last_name: last, dob,
      phone: clean(body.pphone, 30), medical: !!clean(body.med, 200), medical_note: clean(body.med, 200),
      photo_consent: body.photo === "1" || body.photo === true, source: "Self sign-up",
    });
    if (pErr) return json({ error: "Couldn't save the player: " + pErr.message }, 500);
    meta = { role: "parent", guardian_id: g.id }; fullName = gname;
  }
  meta.full_name = fullName;

  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata: meta });
  if (error || !data.user) return json({ error: "Couldn't create the account: " + (error?.message ?? "") }, 500);
  const userId = data.user.id;
  // The auth trigger can fire before the metadata lands, so link the profile ourselves.
  const { error: prErr } = await admin.from("profiles").upsert({
    id: userId, role: meta.role, full_name: fullName,
    coach_id: meta.coach_id ?? null, guardian_id: meta.guardian_id ?? null, player_id: null,
  });
  if (prErr) return json({ error: "Couldn't link the account: " + prErr.message }, 500);
  if (meta.coach_id) await admin.from("coaches").update({ profile_id: userId }).eq("id", meta.coach_id);
  if (meta.guardian_id) await admin.from("guardians").update({ profile_id: userId }).eq("id", meta.guardian_id);
  await admin.from("invites").update({ used_at: new Date().toISOString() }).eq("id", inv.id);

  return json({ ok: true, email, role: meta.role, name: fullName });
});
