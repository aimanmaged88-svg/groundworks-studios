// End-to-end check of the Clutch backend: activation, sign-in, kid codes, and the
// row-level rules for every role. Uses only the public anon key, the way the apps do.
// Run after seeding the TEST rows:  node rls.mjs
const URL = process.env.SUPA_URL, KEY = process.env.SUPA_ANON;
const H = { apikey: KEY, "Content-Type": "application/json" };
let failed = 0;
const ok = (cond, name, extra = "") => { console.log((cond ? "PASS " : "FAIL ") + name + (cond ? "" : "  " + extra)); if (!cond) failed++; };

async function fn(name, body) {
  const r = await fetch(`${URL}/functions/v1/${name}`, { method: "POST", headers: H, body: JSON.stringify(body) });
  return { status: r.status, body: await r.json().catch(() => ({})) };
}
async function signIn(email, password) {
  const r = await fetch(`${URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: H, body: JSON.stringify({ email, password }) });
  const j = await r.json(); if (!j.access_token) throw new Error("sign-in failed for " + email + ": " + JSON.stringify(j));
  return j.access_token;
}
const rest = (jwt) => ({
  async get(path) { const r = await fetch(`${URL}/rest/v1/${path}`, { headers: { ...H, Authorization: `Bearer ${jwt}` } }); return { status: r.status, data: await r.json().catch(() => null) }; },
  async post(path, body, prefer = "return=representation") { const r = await fetch(`${URL}/rest/v1/${path}`, { method: "POST", headers: { ...H, Authorization: `Bearer ${jwt}`, Prefer: prefer }, body: JSON.stringify(body) }); return { status: r.status, data: await r.json().catch(() => null) }; },
  async patch(path, body) { const r = await fetch(`${URL}/rest/v1/${path}`, { method: "PATCH", headers: { ...H, Authorization: `Bearer ${jwt}`, Prefer: "return=representation" }, body: JSON.stringify(body) }); return { status: r.status, data: await r.json().catch(() => null) }; },
  async rpc(name, args) { const r = await fetch(`${URL}/rest/v1/rpc/${name}`, { method: "POST", headers: { ...H, Authorization: `Bearer ${jwt}` }, body: JSON.stringify(args) }); return { status: r.status, data: await r.json().catch(() => null) }; },
});

// 1. Activation
let r = await fn("activate", { email: "test-parent-a@example.com", code: "WRONGCODE", password: "password123" });
ok(r.status === 401, "wrong activation code is rejected", JSON.stringify(r));
r = await fn("activate", { email: "test-parent-a@example.com", code: "TESTPA01", password: "short" });
ok(r.status === 400, "short password is rejected");
r = await fn("activate", { email: "test-parent-a@example.com", code: "testpa01", password: "parentA-pass1" });
ok(r.status === 200 && r.body.role === "parent", "parent A activates (code is case-insensitive)", JSON.stringify(r));
r = await fn("activate", { email: "test-parent-a@example.com", code: "TESTPA01", password: "parentA-pass1" });
ok(r.status === 401, "a used activation code no longer works");
r = await fn("activate", { email: "test-parent-b@example.com", code: "TESTPB01", password: "parentB-pass1" });
ok(r.status === 200, "parent B activates");
r = await fn("activate", { email: "test-coach@example.com", code: "TESTCO01", password: "coach-pass12" });
ok(r.status === 200 && r.body.role === "coach", "coach activates", JSON.stringify(r));
r = await fn("activate", { email: "test-admin@example.com", code: "TESTAD01", password: "admin-pass12" });
ok(r.status === 200 && r.body.role === "admin", "admin activates", JSON.stringify(r));

const A = rest(await signIn("test-parent-a@example.com", "parentA-pass1"));
const B = rest(await signIn("test-parent-b@example.com", "parentB-pass1"));
const C = rest(await signIn("test-coach@example.com", "coach-pass12"));
const AD = rest(await signIn("test-admin@example.com", "admin-pass12"));

// 2. Who sees which players
let p = await A.get("players?select=id,first_name,last_name,medical_note,family_id&order=last_name");
ok(p.data.length === 2 && p.data.every(x => x.last_name.startsWith("Kid A")), "parent A sees only her own two kids", JSON.stringify(p.data));
const kidA1 = p.data.find(x => x.last_name === "Kid A1"), kidA2 = p.data.find(x => x.last_name === "Kid A2");
p = await B.get("players?select=id,last_name");
ok(p.data.length === 1 && p.data[0].last_name === "Kid B1", "parent B sees only her kid");
const kidB1 = p.data[0];
p = await C.get("players?select=last_name&order=last_name");
ok(p.data.map(x => x.last_name).join() === "Kid A1,Kid B1", "coach sees the two kids on his team, not the U12", JSON.stringify(p.data));
p = await AD.get("players?select=last_name&last_name=like.TEST*");
ok(p.data.length === 0, "(players last_name filter sanity)");
p = await AD.get("players?select=last_name&first_name=eq.TEST");
ok(p.data.length === 3, "admin sees all three kids");

// 3. Families, guardians, payments, notes
let g = await B.get("guardians?select=name,phone,email");
ok(g.data.length === 1 && g.data[0].name === "TEST Parent B", "parent B can't see family A's guardian details", JSON.stringify(g.data));
g = await C.get("guardians?select=name&order=name");
ok(g.data.map(x => x.name).join() === "TEST Parent A,TEST Parent B", "coach sees the parents of his team's players", JSON.stringify(g.data));
let pay = await A.get("payments?select=amount");
ok(pay.data.length === 0, "parent A sees no payments (family B paid, not A)");
pay = await B.get("payments?select=amount");
ok(pay.data.length === 1, "parent B sees her own payment");
let n = await A.get("player_notes?select=id");
ok(n.data.length === 0 && n.status === 200, "parents see no coach notes");
let ins = await C.post("player_notes", { player_id: kidA1.id, body: "TEST note", by_name: "TEST Coach" });
ok(ins.status === 201, "coach can write a note on his own player", JSON.stringify(ins));
ins = await C.post("player_notes", { player_id: kidA2.id, body: "TEST note", by_name: "TEST Coach" });
ok(ins.status === 403 || ins.status === 401, "coach can't write a note on a player from another team", JSON.stringify(ins));

// 4. Availability and roll
const key = `${kidA1.team_id || ""}`;
const teams = (await A.get("teams?select=id,div")).data;
const t1 = teams.find(t => t.div === "TEST Div 1");
const sess = `${t1.id}|2026-10-09|G`;
ins = await A.post("availability", { session_key: sess, player_id: kidA1.id, status: "in" }, "return=representation,resolution=merge-duplicates");
ok(ins.status === 201, "parent A marks her kid IN", JSON.stringify(ins));
ins = await B.post("availability", { session_key: sess, player_id: kidA1.id, status: "out" }, "return=representation,resolution=merge-duplicates");
ok(ins.status !== 201, "parent B can't set availability for family A's kid", JSON.stringify(ins));
ins = await A.post("roll", { session_key: sess, player_id: kidA1.id, present: true });
ok(ins.status !== 201, "parents can't take the roll");
ins = await C.post("roll", { session_key: sess, player_id: kidA1.id, present: true }, "return=representation,resolution=merge-duplicates");
ok(ins.status === 201, "coach takes the roll for his player");
let roll = await A.get("roll?select=present");
ok(roll.data.length === 1, "parent A can see her kid's roll entry");

// 5. Messaging
let conv = await A.rpc("open_conversation", { p_kind: "coach", p_family: kidA1.family_id, p_team: t1.id });
ok(conv.status === 200 && typeof conv.data === "string", "parent A opens the coach thread", JSON.stringify(conv));
const coachThread = conv.data;
conv = await B.rpc("open_conversation", { p_kind: "coach", p_family: kidA1.family_id, p_team: t1.id });
ok(conv.status !== 200, "parent B can't open family A's coach thread", JSON.stringify(conv));
let msg = await A.post("messages", { conversation_id: coachThread, body: "TEST hello coach" });
ok(msg.status === 201 && msg.data[0].sender_name === "TEST Parent A" && msg.data[0].sender_role === "parent", "parent's message is stamped with her name and role", JSON.stringify(msg.data));
msg = await C.get(`messages?select=body&conversation_id=eq.${coachThread}`);
ok(msg.data.length === 1, "coach reads the thread");
msg = await B.get(`messages?select=body&conversation_id=eq.${coachThread}`);
ok(msg.data.length === 0, "parent B can't read family A's thread");
msg = await B.post("messages", { conversation_id: coachThread, body: "TEST intruder" });
ok(msg.status !== 201, "parent B can't post into family A's thread");
msg = await AD.get(`messages?select=body&conversation_id=eq.${coachThread}`);
ok(msg.data.length === 1, "admin can read coach threads");
const famThread = (await A.rpc("open_conversation", { p_kind: "family", p_family: kidA1.family_id, p_team: null })).data;
msg = await AD.get(`messages?select=body&conversation_id=eq.${famThread}`);
ok(msg.status === 200 && msg.data.length === 0, "admin does not see inside a family's private thread");
conv = await A.rpc("open_conversation", { p_kind: "club", p_family: kidA1.family_id, p_team: null });
ok(conv.status === 200, "parent A opens the club thread");

// 6. Kid sign-in
let code = await B.rpc("create_player_code", { p_player: kidA1.id });
ok(code.status !== 200, "parent B can't make a code for family A's kid", JSON.stringify(code));
code = await A.rpc("create_player_code", { p_player: kidA1.id });
ok(code.status === 200 && /^\d{6}$/.test(code.data), "parent A makes a six-digit code for kid A1", JSON.stringify(code));
r = await fn("kid-login", { code: "000000" });
ok(r.status === 401 || r.status === 400, "a wrong kid code fails");
r = await fn("kid-login", { code: code.data });
ok(r.status === 200 && r.body.token_hash, "kid code works", JSON.stringify(r));
let ver = await fetch(`${URL}/auth/v1/verify`, { method: "POST", headers: H, body: JSON.stringify({ type: "magiclink", token_hash: r.body.token_hash }) });
let vj = await ver.json();
ok(!!vj.access_token, "kid gets a session from the token", JSON.stringify(vj).slice(0, 200));
const K = rest(vj.access_token);
r = await fn("kid-login", { code: code.data });
ok(r.status === 401, "a used kid code no longer works");
p = await K.get("players?select=last_name,medical_note&order=last_name");
ok(p.data.length === 2, "kid sees own family's players", JSON.stringify(p.data));
pay = await K.get("payments?select=amount");
ok(pay.data.length === 0, "kid sees no payments");
g = await K.get("guardians?select=name");
ok(g.data.length === 1 && g.data[0].name === "TEST Parent A", "kid sees own parent only");
msg = await K.post("messages", { conversation_id: famThread, body: "TEST hi mum" });
ok(msg.status === 201 && msg.data[0].sender_role === "player", "kid can message the family thread");
msg = await K.post("messages", { conversation_id: coachThread, body: "TEST hi coach" });
ok(msg.status === 201, "kid can message the coach thread (parents are in it)");
conv = await K.rpc("open_conversation", { p_kind: "club", p_family: kidA1.family_id, p_team: null });
ok(conv.status !== 200, "kid can't open the club thread");
const famB = kidB1.family_id || (await AD.get(`players?select=family_id&id=eq.${kidB1.id}`)).data[0].family_id;
conv = await K.rpc("open_conversation", { p_kind: "family", p_family: famB, p_team: null });
ok(conv.status !== 200, "kid can't open another family's thread");
code = await K.rpc("create_player_code", { p_player: kidA2.id });
ok(code.status !== 200, "a kid can't make sign-in codes");

// 7. Board moderation
let post = await A.post("posts", { body: "TEST post from parent", status: "approved" });
ok(post.status === 201 && post.data[0].status === "pending", "parent's post is held as pending even if they ask for approved", JSON.stringify(post.data));
const postId = post.data[0].id;
let seen = await B.get(`posts?select=id&id=eq.${postId}`);
ok(seen.data.length === 0, "parent B can't see the pending post");
seen = await A.get(`posts?select=id,status&id=eq.${postId}`);
ok(seen.data.length === 1, "the author can see their own pending post");
let cm = await B.post("comments", { post_id: postId, body: "TEST comment" });
ok(cm.status !== 201, "nobody can comment on a post that isn't approved yet");
let upd = await B.patch(`posts?id=eq.${postId}`, { status: "approved" });
ok(upd.status !== 200 || upd.data.length === 0, "parents can't approve posts", JSON.stringify(upd));
upd = await AD.patch(`posts?id=eq.${postId}`, { status: "approved" });
ok(upd.status === 200 && upd.data[0].status === "approved", "admin approves the post");
seen = await B.get(`posts?select=id&id=eq.${postId}`);
ok(seen.data.length === 1, "parent B sees it once approved");
cm = await K.post("comments", { post_id: postId, body: "TEST comment from kid" });
ok(cm.status === 201 && cm.data[0].status === "pending", "kid's comment is held for approval");
seen = await B.get(`comments?select=id&post_id=eq.${postId}`);
ok(seen.data.length === 0, "pending comment isn't visible to others");
upd = await AD.patch(`comments?id=eq.${cm.data[0].id}`, { status: "approved" });
seen = await B.get(`comments?select=id&post_id=eq.${postId}`);
ok(seen.data.length === 1, "approved comment is visible");
let like = await K.post("post_likes", { post_id: postId, profile_id: "00000000-0000-0000-0000-000000000000" });
ok(like.status !== 201, "can't like as someone else");
post = await AD.post("posts", { body: "TEST admin notice post" });
ok(post.status === 201 && post.data[0].status === "approved", "admin posts go straight up");

// 8. Coach limits
let cw = await C.get("coaches?select=name,wwcc_no,phone");
ok(cw.status === 200 && cw.data.length >= 1, "coach can read the coach list (staff)");
cw = await A.get("coaches?select=name");
ok(cw.data.length === 0, "parents can't read the coaches table");
cw = await A.get("coaches_public?select=name");
ok(cw.data.some(x => x.name === "TEST Coach"), "parents can read coach names through the public view");
let reg = await C.get("registrations?select=id");
ok(reg.data.length === 0, "coaches can't see registrations");
let tm = await C.post("teams", { age: "U18", div: "TEST X", comp: "x" });
ok(tm.status !== 201, "coaches can't create teams");
let act = await C.rpc("create_activation_code", { p_kind: "guardian", p_target: null, p_email: "x@example.com" });
ok(act.status !== 200, "coaches can't make activation codes");
act = await AD.rpc("create_activation_code", { p_kind: "guardian", p_target: null, p_email: "test-zz@example.com" });
ok(act.status === 200 && /^[A-Z2-9]{8}$/.test(act.data), "admin makes an activation code", JSON.stringify(act));

// 9. Nobody signed in
const NOBODY = rest("");
p = await fetch(`${URL}/rest/v1/players?select=id`, { headers: H }); const pj = await p.json();
ok(Array.isArray(pj) ? pj.length === 0 : true, "anon key alone sees no players", JSON.stringify(pj).slice(0, 120));

console.log(failed ? `\n${failed} FAILED` : "\nALL PASSED");
process.exit(failed ? 1 : 0);
