// My Words — Behaviour Log API
// Custom auth: share codes gate every action (verify_jwt off; nothing here
// trusts the caller's identity except via a share code or a Supabase user JWT).
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization, apikey",
  "access-control-allow-methods": "POST, OPTIONS",
};

const H = { apikey: SRK, authorization: `Bearer ${SRK}`, "content-type": "application/json" };
async function db(path: string, init: RequestInit = {}) {
  const r = await fetch(`${SB_URL}/rest/v1/${path}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const txt = await r.text();
  let data: unknown = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { /* leave null */ }
  return { ok: r.ok, status: r.status, data };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...CORS } });

const sid = (v: unknown, max = 64) => String(v ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, max);
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const arr = (v: unknown, maxItems = 30, maxLen = 120) =>
  Array.isArray(v) ? v.slice(0, maxItems).map((x) => str(x, maxLen)).filter(Boolean) : [];

async function shareByCode(code: string) {
  const { data } = await db(`mw_shares?code=eq.${sid(code, 32)}&revoked=is.false&select=*`);
  return Array.isArray(data) && data[0] ? data[0] : null;
}

async function sha24(s: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(d)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 24);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, message: "POST only" }, 405);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ ok: false, message: "Bad JSON" }, 400); }
  const action = String(body.action ?? "");

  if (action === "form_config") {
    const share = await shareByCode(String(body.code ?? ""));
    if (!share) return json({ ok: false, code: "badcode", message: "This link isn’t active any more. Ask the family for a fresh one." }, 403);
    const [{ data: ppl }, { data: cfg }] = await Promise.all([
      db(`mw_people?id=eq.${share.person_id}&select=name`),
      db(`mw_behaviour_config?person_id=eq.${share.person_id}&select=config`),
    ]);
    const person = Array.isArray(ppl) && ppl[0] ? ppl[0].name : "";
    const config = Array.isArray(cfg) && cfg[0] ? cfg[0].config : {};
    return json({ ok: true, person, config, role: share.role, label: share.label });
  }

  if (action === "log_submit") {
    if (str(body.website, 10)) return json({ ok: true, id: 0 }); // honeypot
    const share = await shareByCode(String(body.code ?? ""));
    if (!share) return json({ ok: false, code: "badcode", message: "This link isn’t active any more. Ask the family for a fresh one." }, 403);
    const e = (body.entry ?? {}) as Record<string, unknown>;
    const when = new Date(String(e.occurred_at ?? ""));
    const now = Date.now();
    if (isNaN(when.getTime()) || when.getTime() > now + 36e5 || when.getTime() < now - 366 * 864e5) {
      return json({ ok: false, message: "Please check the date and time of the incident." }, 400);
    }
    const behaviours = arr(e.behaviours);
    if (!behaviours.length) return json({ ok: false, message: "Pick at least one behaviour." }, 400);
    const eff = Number(e.effectiveness);
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
    const ipHash = await sha24(`mwlog:${ip}`);
    const since = new Date(now - 864e5).toISOString();
    const [{ data: pRows }, { data: iRows }] = await Promise.all([
      db(`mw_behaviour_logs?person_id=eq.${share.person_id}&created_at=gte.${since}&select=id&limit=100`),
      db(`mw_behaviour_logs?ip_hash=eq.${ipHash}&created_at=gte.${since}&select=id&limit=60`),
    ]);
    if (Array.isArray(pRows) && pRows.length >= 100) return json({ ok: false, message: "That’s a lot of entries today — please slow down or contact the family." }, 429);
    if (Array.isArray(iRows) && iRows.length >= 50) return json({ ok: false, message: "Too many entries from this device today. Please try again later." }, 429);
    const row = {
      owner: share.owner,
      person_id: share.person_id,
      occurred_at: when.toISOString(),
      reporter_name: str(e.reporter_name, 80),
      reporter_relation: str(e.reporter_relation, 120),
      behaviours,
      locations: arr(e.locations),
      antecedents: arr(e.antecedents),
      what: str(e.what, 2000),
      duration: str(e.duration, 40),
      responses: arr(e.responses),
      effectiveness: Number.isInteger(eff) && eff >= 1 && eff <= 5 ? eff : null,
      notes: str(e.notes, 2000),
      via: share.role === "therapist" ? "therapist" : "form",
      ip_hash: ipHash,
    };
    const ins = await db(`mw_behaviour_logs`, { method: "POST", headers: { prefer: "return=representation" }, body: JSON.stringify(row) });
    if (!ins.ok) return json({ ok: false, message: "Couldn’t save that. Please try again." }, 500);
    const id = Array.isArray(ins.data) && ins.data[0] ? ins.data[0].id : 0;
    return json({ ok: true, id });
  }

  if (action === "share_claim") {
    const token = String(body.token ?? "");
    if (!token) return json({ ok: false, message: "Please sign in first." }, 401);
    const ur = await fetch(`${SB_URL}/auth/v1/user`, { headers: { apikey: SRK, authorization: `Bearer ${token}` } });
    if (!ur.ok) return json({ ok: false, message: "Please sign in again." }, 401);
    const user = await ur.json();
    const uid = sid(user?.id ?? "", 40);
    if (!uid) return json({ ok: false, message: "Please sign in again." }, 401);
    const share = await shareByCode(String(body.code ?? ""));
    if (!share || share.role !== "therapist") return json({ ok: false, message: "That code doesn’t match an active therapist invite." }, 403);
    if (share.claimed_by && share.claimed_by !== uid) return json({ ok: false, message: "That code has already been used by someone else." }, 403);
    const up = await db(`mw_shares?id=eq.${share.id}`, { method: "PATCH", headers: { prefer: "return=representation" }, body: JSON.stringify({ claimed_by: uid }) });
    if (!up.ok) return json({ ok: false, message: "Couldn’t link the code. Please try again." }, 500);
    const { data: ppl } = await db(`mw_people?id=eq.${share.person_id}&select=name`);
    return json({ ok: true, person: Array.isArray(ppl) && ppl[0] ? ppl[0].name : "" });
  }

  return json({ ok: false, message: "unknown action" }, 400);
});
