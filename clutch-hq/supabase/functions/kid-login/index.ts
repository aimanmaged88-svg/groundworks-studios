// A player signs in with the six-digit code their parent made in the Clutch app.
// We find the player, make sure they have an auth account (a synthetic address, no
// email is ever sent), burn the code, and hand back a one-time token the app turns
// into a session. The session then stays on the kid's device.
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

  let body: { code?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  const code = String(body.code || "").replace(/\D/g, "");
  if (code.length !== 6) return json({ error: "The code is six digits" }, 400);

  const { data: failures } = await admin.rpc("recent_failures", { p_ip: ip, p_kind: "kid" });
  if ((failures ?? 0) >= 8) return json({ error: "Too many tries. Ask your parent for a new code in 15 minutes." }, 429);

  const { data: match, error: mErr } = await admin.rpc("match_player_code", { p_code: code });
  if (mErr) return json({ error: "Something went wrong" }, 500);
  if (!match || !match.id) {
    await admin.from("auth_attempts").insert({ ip, kind: "kid" });
    return json({ error: "That code didn't work. Ask your parent to make a new one in the Clutch app." }, 401);
  }

  const { data: player } = await admin.from("players").select("id,first_name,last_name,profile_id,status").eq("id", match.player_id).single();
  if (!player || player.status !== "active") return json({ error: "This player isn't active" }, 410);

  const email = `player-${player.id}@players.clutchbasketball.com.au`;
  const meta = { role: "player", player_id: player.id, full_name: `${player.first_name} ${player.last_name}` };
  let userId = player.profile_id as string | null;
  if (!userId) {
    const { data: existing } = await admin.rpc("user_id_by_email", { p_email: email });
    userId = existing ?? null;
  }
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { app_metadata: meta });
    if (error) return json({ error: "Couldn't update the account" }, 500);
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, app_metadata: meta });
    if (error || !data.user) return json({ error: "Couldn't create the account" }, 500);
    userId = data.user.id;
  }
  // The auth trigger can fire before the metadata lands, so link the profile ourselves.
  await admin.from("profiles").upsert({ id: userId, role: "player", full_name: meta.full_name, player_id: player.id, coach_id: null, guardian_id: null });
  await admin.from("players").update({ profile_id: userId }).eq("id", player.id);
  await admin.from("player_codes").update({ used_at: new Date().toISOString() }).eq("id", match.id);

  const { data: link, error: lErr } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (lErr || !link?.properties?.hashed_token) return json({ error: "Couldn't start the session" }, 500);

  return json({ ok: true, token_hash: link.properties.hashed_token, name: player.first_name });
});
