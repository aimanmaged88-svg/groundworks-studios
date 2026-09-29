import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { C, P, S, U, as, closePool, expectDenied, loadFixture, runAs } from "./db";

beforeAll(async () => {
  await loadFixture();
});
afterAll(closePool);

const payload = (over: Record<string, unknown> = {}) => ({
  player: { first_name: "Sam", last_name: "Synthetic", dob: "2014-02-11", gender: "Boy", school: "Example Primary" },
  guardian: { first_name: "Jo", last_name: "Synthetic", email: "jo@family.example", mobile: "0400 000 999", relationship: "Mother" },
  sensitive: { medical: "Peanut allergy", ambulance_cover: "Yes", emergency_name: "Kim", emergency_phone: "0400 000 998" },
  registration: { uniform_size: "Youth M", experience: "Brand new", heard_via: "Instagram", notes: "Wants to play with a friend" },
  custom: { jersey_pref: "7" },
  consents: [
    { key: "medical", granted: true, text_shown: "medical text v1" },
    { key: "conduct", granted: true, text_shown: "conduct text v1" },
    { key: "photos", granted: false, text_shown: "photos text v1" },
  ],
  ...over,
});

describe("age_group_for", () => {
  it("age at a cutoff date", async () => {
    const rows = await runAs(as.user(U.adminA), async (q) =>
      (
        await q.query(
          `select public.age_group_for('2015-01-15', $1) as a,
                  public.age_group_for('2014-12-31', $1) as b,
                  public.age_group_for('2012-06-01', $1) as c,
                  public.age_group_for('2008-01-01', $1) as d,
                  public.age_group_for(null, $1) as e`,
          [S.A],
        )
      ).rows[0],
    );
    // cutoff 2026-12-31: born 2015-01-15 is 11 -> U12; 2014-12-31 is exactly 12 -> U14; 2012 is 14 -> U16; 2008 is 18 -> none
    expect(rows).toEqual({ a: "U12", b: "U14", c: "U16", d: null, e: null });
  });
  it("birth year", async () => {
    const rows = await runAs(as.user(U.adminB), async (q) =>
      (await q.query(`select public.age_group_for('2016-07-07', $1) as a, public.age_group_for('2013-01-01', $1) as b, public.age_group_for('2010-01-01', $1) as c`, [S.B])).rows[0],
    );
    expect(rows).toEqual({ a: "U12", b: "U14", c: null });
  });
});

describe("submit_registration (server-side, service role)", () => {
  it("is not callable by anon or signed-in users", async () => {
    await expectDenied(runAs(as.anon, (q) => q.query("select public.submit_registration('rls-club-a', $1)", [payload()])));
    await expectDenied(runAs(as.user(U.parentA1), (q) => q.query("select public.submit_registration('rls-club-a', $1)", [payload()])));
  });

  it("creates the family, the registration, the consents and the fee in one go", async () => {
    const out = await runAs(as.service, async (q) => {
      const reg = (await q.query("select public.submit_registration('rls-club-a', $1, 'iphash', 'ua') as id", [payload()])).rows[0].id;
      const r = (await q.query("select * from public.registrations where id = $1", [reg])).rows[0];
      const player = (await q.query("select * from public.people where id = $1", [r.player_person_id])).rows[0];
      const guardian = (await q.query("select * from public.people where id = $1", [r.guardian_person_id])).rows[0];
      const sens = (await q.query("select * from public.person_sensitive where person_id = $1", [r.player_person_id])).rows[0];
      const consents = (await q.query("select consent_key, granted, text_shown, form_version from public.consents where registration_id = $1 order by consent_key", [reg])).rows;
      const fee = (await q.query("select amount_cents, status from public.fees where person_id = $1 and season_id = $2", [r.player_person_id, S.A])).rows[0];
      const gship = (await q.query("select relationship from public.guardianships where child_person_id = $1 and guardian_person_id = $2", [r.player_person_id, r.guardian_person_id])).rows[0];
      const audit = (await q.query("select count(*)::int as n from public.audit_log where action = 'registration.submit' and target_id = $1", [reg])).rows[0].n;
      return { r, player, guardian, sens, consents, fee, gship, audit };
    });
    expect(out.r.status).toBe("new");
    expect(out.r.form_version).toBe(1);
    expect(out.r.season_id).toBe(S.A);
    expect(out.r.possible_duplicate).toBe(false);
    expect(out.r.custom).toEqual({ jersey_pref: "7" });
    expect(out.player.first_name).toBe("Sam");
    expect(out.player.has_medical_flag).toBe(true);
    expect(out.player.photo_consent).toBe(false);
    expect(out.guardian.email).toBe("jo@family.example");
    expect(out.sens.medical).toBe("Peanut allergy");
    expect(out.consents).toEqual([
      { consent_key: "conduct", granted: true, text_shown: "conduct text v1", form_version: 1 },
      { consent_key: "medical", granted: true, text_shown: "medical text v1", form_version: 1 },
      { consent_key: "photos", granted: false, text_shown: "photos text v1", form_version: 1 },
    ]);
    expect(out.fee).toEqual({ amount_cents: 15000, status: "owing" });
    expect(out.gship.relationship).toBe("Mother");
    expect(out.audit).toBe(1);
  });

  it("reuses the guardian by email and flags a second registration of the same child as a possible duplicate", async () => {
    const out = await runAs(as.service, async (q) => {
      const first = (await q.query("select public.submit_registration('rls-club-a', $1) as id", [payload()])).rows[0].id;
      const second = (await q.query("select public.submit_registration('rls-club-a', $1) as id", [payload({ registration: { uniform_size: "Youth L" } })])).rows[0].id;
      const a = (await q.query("select player_person_id, guardian_person_id, possible_duplicate from public.registrations where id = $1", [first])).rows[0];
      const b = (await q.query("select player_person_id, guardian_person_id, possible_duplicate from public.registrations where id = $1", [second])).rows[0];
      const guardians = (await q.query("select count(*)::int as n from public.people where club_id = $1 and email = 'jo@family.example'", [C.A])).rows[0].n;
      const fees = (await q.query("select count(*)::int as n from public.fees where person_id = $1", [a.player_person_id])).rows[0].n;
      return { a, b, guardians, fees };
    });
    expect(out.a.possible_duplicate).toBe(false);
    expect(out.b.possible_duplicate).toBe(true);
    expect(out.b.player_person_id).toBe(out.a.player_person_id);
    expect(out.b.guardian_person_id).toBe(out.a.guardian_person_id);
    expect(out.guardians).toBe(1);
    expect(out.fees).toBe(1);
  });

  it("treats 'None' as no medical flag", async () => {
    const flag = await runAs(as.service, async (q) => {
      const reg = (await q.query("select public.submit_registration('rls-club-a', $1) as id", [payload({ sensitive: { medical: " none. " }, player: { first_name: "Nomed", last_name: "Kid", dob: "2015-05-05" } })])).rows[0].id;
      return (await q.query("select p.has_medical_flag from public.registrations r join public.people p on p.id = r.player_person_id where r.id = $1", [reg])).rows[0].has_medical_flag;
    });
    expect(flag).toBe(false);
  });

  it("refuses a club that is not live", async () => {
    await expect(
      runAs(as.service, async (q) => {
        await q.query("update public.clubs set status = 'onboarding' where id = $1", [C.A]);
        await q.query("select public.submit_registration('rls-club-a', $1)", [payload()]);
      }),
    ).rejects.toThrow(/not live/);
  });
});

describe("get_public_form", () => {
  it("anon gets the club, form and season for an active club and nothing for an unknown one", async () => {
    const form = await runAs(as.anon, async (q) => (await q.query("select public.get_public_form('rls-club-a') as f")).rows[0].f);
    expect(form.club.name).toBe("RLS Club A");
    expect(form.form.version).toBe(1);
    expect(form.form.fields.length).toBeGreaterThan(10);
    expect(form.season.fee_cents).toBe(15000);
    expect(form.season.divisions.map((d: { name: string }) => d.name)).toEqual(["U12", "U14", "U16", "U18"]);
    expect(form.club.vocabulary.event).toBe("game");
    const missing = await runAs(as.anon, async (q) => (await q.query("select public.get_public_form('nope') as f")).rows[0].f);
    expect(missing).toBeNull();
  });
});

describe("create_club and invites", () => {
  it("a new user can create a club and becomes its admin with a trial, a form and level config", async () => {
    const out = await runAs(as.user(U.newbie), async (q) => {
      const id = (await q.query("select public.create_club('Newbie Hoops', 'newbie-hoops', 'basketball') as id")).rows[0].id;
      const club = (await q.query("select name, status from public.clubs where id = $1", [id])).rows[0];
      const roles = (await q.query("select role from public.club_users where club_id = $1 and user_id = $2", [id, U.newbie])).rows.map((r) => r.role);
      const sub = (await q.query("select status, plan from public.subscriptions where club_id = $1", [id])).rows[0];
      const form = (await q.query("select version, jsonb_array_length(fields) as n from public.form_templates where club_id = $1", [id])).rows[0];
      const lv = (await q.query("select jsonb_array_length(levels) as n from public.level_config where club_id = $1", [id])).rows[0];
      return { club, roles, sub, form, lv };
    });
    expect(out.club).toEqual({ name: "Newbie Hoops", status: "onboarding" });
    expect(out.roles).toEqual(["admin"]);
    expect(out.sub).toEqual({ status: "trialing", plan: "club" });
    expect(out.form.version).toBe(1);
    expect(out.form.n).toBeGreaterThan(10);
    expect(out.lv.n).toBe(6);
  });

  it("anon cannot create a club", async () => {
    await expectDenied(runAs(as.anon, (q) => q.query("select public.create_club('X', 'x-club', 'basketball')")));
  });

  it("an invited user becomes a coach of club A after accepting; the wrong token fails", async () => {
    const out = await runAs(as.user(U.newbie), async (q) => {
      const club = (await q.query("select public.accept_invite('invite-token-a') as c")).rows[0].c;
      const roles = (await q.query("select role from public.club_users where club_id = $1 and user_id = $2", [club, U.newbie])).rows.map((r) => r.role);
      return { club, roles };
    });
    expect(out.club).toBe(C.A);
    expect(out.roles).toEqual(["coach"]);
    await expect(runAs(as.user(U.newbie), (q) => q.query("select public.accept_invite('invite-token-zzz')"))).rejects.toThrow(/not found/);
  });

  it("an admin can create an invite and gets a token back; the hash is stored, not the token", async () => {
    const out = await runAs(as.user(U.adminA), async (q) => {
      const token = (await q.query("select public.create_invite($1, 'someone-new@rls.test', 'parent') as t", [C.A])).rows[0].t as string;
      const stored = (await q.query("select token_hash from public.invites where email = 'someone-new@rls.test'")).rows[0].token_hash as string;
      return { token, stored };
    });
    expect(out.token).toHaveLength(48);
    expect(out.stored).not.toBe(out.token);
    expect(out.stored).toHaveLength(64);
  });
});

describe("upsert_person_sensitive", () => {
  it("a guardian can update their own child's details; another parent cannot", async () => {
    await runAs(as.user(U.parentA1), (q) => q.query("select public.upsert_person_sensitive($1, 'Asthma, new inhaler', 'Yes', 'Aunt One', '0400 000 001', 'Aunt')", [P.childA1]));
    await expectDenied(runAs(as.user(U.parentA2), (q) => q.query("select public.upsert_person_sensitive($1, 'x', null, null, null, null)", [P.childA1])));
  });
});

describe("rate_limit_hit", () => {
  it("allows up to the limit in a window, then refuses; server only", async () => {
    const results = await runAs(as.service, async (q) => {
      const out: boolean[] = [];
      for (let i = 0; i < 4; i++) out.push((await q.query("select public.rate_limit_hit('test:key', 3, interval '1 minute') as ok")).rows[0].ok);
      return out;
    });
    expect(results).toEqual([true, true, true, false]);
    await expectDenied(runAs(as.anon, (q) => q.query("select public.rate_limit_hit('x', 3, interval '1 minute')")));
  });
});
