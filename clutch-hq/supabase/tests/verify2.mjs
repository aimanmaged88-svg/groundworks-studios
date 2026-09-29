// Round-2 checks: admin auto-approve fix + the feature-pack tables' rules.
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_ANON;
const H = { apikey: KEY, "Content-Type": "application/json" };
let failed = 0;
const ok = (c, n, x = "") => { console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + x)); if (!c) failed++; };
async function signIn(email, password) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
  const j = await r.json(); if (!j.access_token) throw new Error("no session for " + email);
  return j.access_token;
}
const rest = (jwt) => ({
  get: async (p) => { const r = await fetch(`${URL}/rest/v1/${p}`, { headers: { ...H, Authorization: `Bearer ${jwt}` } }); return { status: r.status, data: await r.json().catch(() => null) }; },
  post: async (p, b) => { const r = await fetch(`${URL}/rest/v1/${p}`, { method: "POST", headers: { ...H, Authorization: `Bearer ${jwt}`, Prefer: "return=representation" }, body: JSON.stringify(b) }); return { status: r.status, data: await r.json().catch(() => null) }; },
});
const A = rest(await signIn("test-parent-a@example.com", "parentA-pass1"));
const C = rest(await signIn("test-coach@example.com", "coach-pass12"));
const AD = rest(await signIn("test-admin@example.com", "admin-pass12"));

let post = await AD.post("posts", { body: "TEST admin announcement" });
ok(post.status === 201 && post.data[0].status === "approved", "admin posts go straight up", JSON.stringify(post.data));

const kids = (await A.get("players?select=id,last_name,team_id&order=last_name")).data;
const kidA1 = kids[0];
const fx = await AD.post("fixtures", { team_id: kidA1.team_id, date: "2026-09-26", time: "18:00", opp: "TEST Opp", video_url: "https://gloryleague.tv/test" });
ok(fx.status === 201, "admin adds a fixture with a GloryLeague link", JSON.stringify(fx.data));
const fxid = fx.data[0].id;
let st = await C.post("game_stats", { fixture_id: fxid, player_id: kidA1.id, points: 12 });
ok(st.status === 201, "coach enters game points for his player");
st = await A.post("game_stats", { fixture_id: fxid, player_id: kidA1.id, points: 99 });
ok(st.status !== 201, "parents can't enter stats");
st = await A.get("game_stats?select=points");
ok(st.data.length === 1 && st.data[0].points === 12, "parent sees her kid's points");
let inst = await AD.post("instalments", { player_id: kidA1.id, due: "2026-10-15", amount: 50 });
ok(inst.status === 201, "admin sets up an instalment");
inst = await A.get("instalments?select=amount");
ok(inst.data.length === 1, "parent sees her own kid's instalment");
const B = rest(await signIn("test-parent-b@example.com", "parentB-pass1"));
inst = await B.get("instalments?select=amount");
ok(inst.data.length === 0, "other parents don't");
let m = await A.post("media", { path: "TEST/x.jpg", kind: "image", caption: "TEST pic", status: "approved" });
ok(m.status === 201 && m.data[0].status === "pending", "family gallery upload waits for approval", JSON.stringify(m.data));
m = await C.post("media", { path: "TEST/y.jpg", kind: "image", caption: "TEST coach pic" });
ok(m.status === 201 && m.data[0].status === "approved", "staff gallery upload is approved");
let s = await A.get("season_archive?select=id");
ok(s.data.length === 0 && s.status === 200, "families can't read the season archive (staff view)");
console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
