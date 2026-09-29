// The public registration form (clutch-app/register.html, or the website) posts here.
// Same fields as clutchbasketball.com.au/register. Lands in Clutch HQ under Registrations.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const clean = (v: unknown, max = 200) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  let b: Record<string, unknown>;
  try { b = await req.json(); } catch { return json({ error: "Bad request" }, 400); }
  if (clean(b.website)) return json({ ok: true }); // honeypot field: bots fill it, people don't see it

  const row = {
    first_name: clean(b.first_name, 60), last_name: clean(b.last_name, 60), phone: clean(b.phone, 30),
    dob: /^\d{4}-\d{2}-\d{2}$/.test(String(b.dob ?? "")) ? String(b.dob) : null,
    gname: clean(b.gname, 80), gphone: clean(b.gphone, 30), gemail: clean(b.gemail, 120).toLowerCase(),
    msg: clean(b.msg, 1000), log: [{ d: new Date().toISOString().slice(0, 10), t: "Form submitted." }],
  };
  if (!row.first_name || !row.last_name || !row.gname || !row.gphone) return json({ error: "Player name, parent name and parent phone are needed" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const { data: recent } = await admin.rpc("recent_failures", { p_ip: ip, p_kind: "register" });
  if ((recent ?? 0) >= 5) return json({ error: "Too many registrations from this connection. Try again later." }, 429);
  await admin.from("auth_attempts").insert({ ip, kind: "register" });

  const { error } = await admin.from("registrations").insert(row);
  if (error) return json({ error: "Couldn't save the registration" }, 500);
  return json({ ok: true });
});
