import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { C, E, P, T, U, as, closePool, countAs, expectDenied, loadFixture, runAs } from "./db";

beforeAll(async () => {
  await loadFixture();
});
afterAll(closePool);

const idsAs = (uid: string, table: string, col = "id") =>
  runAs(as.user(uid), async (q) => (await q.query(`select ${col} as v from public.${table}`)).rows.map((r) => r.v as string));

describe("coach: own teams only", () => {
  it("coach A sees the players on their team and themselves, not the other team's player", async () => {
    const ids = await idsAs(U.coachA, "people");
    expect(ids).toContain(P.childA1);
    expect(ids).toContain(P.childA2);
    expect(ids).toContain(P.coachA);
    expect(ids).not.toContain(P.childA3);
    expect(ids).not.toContain(P.childB);
    expect(ids).not.toContain(P.guardianA1); // guardians are not on the roster
  });

  it("coach A can read sensitive details for their own player, and it is audited", async () => {
    const { row, audited } = await runAs(as.user(U.coachA), async (q) => {
      const r = await q.query("select * from public.get_person_sensitive($1)", [P.childA1]);
      // switch back to a superuser view of the audit log inside the same transaction
      await q.query("reset role");
      const a = await q.query(
        "select count(*)::int as n from public.audit_log where action = 'sensitive.view' and actor_user_id = $1 and target_id = $2",
        [U.coachA, P.childA1],
      );
      return { row: r.rows[0], audited: a.rows[0].n as number };
    });
    expect(row.medical).toBe("Asthma, carries inhaler");
    expect(audited).toBe(1);
  });

  it("coach A cannot read sensitive details for a player on another team", async () => {
    await expectDenied(runAs(as.user(U.coachA), (q) => q.query("select * from public.get_person_sensitive($1)", [P.childA3])));
  });

  it("coach A sees only their own team's events plus club-wide ones", async () => {
    const ids = await idsAs(U.coachA, "events");
    expect(ids).toContain(E.teamA1Training);
    expect(ids).toContain(E.clubWideA);
    expect(ids).not.toContain(E.teamA2Game);
    expect(ids).not.toContain(E.teamB1);
  });

  it("coach A can mark attendance for their player but not for another team's player", async () => {
    await runAs(as.user(U.coachA), (q) =>
      q.query("insert into public.attendance (club_id, event_id, person_id, present, marked_by) values ($1, $2, $3, true, $4)", [
        C.A,
        E.teamA1Training,
        P.childA2,
        U.coachA,
      ]),
    );
    await expectDenied(
      runAs(as.user(U.coachA), (q) =>
        q.query("insert into public.attendance (club_id, event_id, person_id, present, marked_by) values ($1, $2, $3, true, $4)", [
          C.A,
          E.teamA2Game,
          P.childA3,
          U.coachA,
        ]),
      ),
    );
  });

  it("coach A sees their own notes and not the other coach's", async () => {
    const bodies = await idsAs(U.coachA, "coach_notes", "body");
    expect(bodies).toEqual(["Great effort this week"]);
  });

  it("coach A cannot see fees, tasks, the audit log or other clubs' anything", async () => {
    expect(await countAs(as.user(U.coachA), "fees")).toBe(0);
    expect(await countAs(as.user(U.coachA), "tasks")).toBe(0);
    expect(await countAs(as.user(U.coachA), "audit_log")).toBe(0);
    expect(await countAs(as.user(U.coachA), "subscriptions")).toBe(0);
  });

  it("coach A cannot change club settings or invite people", async () => {
    const n = await runAs(as.user(U.coachA), async (q) => (await q.query("update public.clubs set name = 'X' where id = $1", [C.A])).rowCount);
    expect(n).toBe(0);
    await expectDenied(runAs(as.user(U.coachA), (q) => q.query("select public.create_invite($1, 'x@rls.test', 'coach')", [C.A])));
  });
});

describe("parent: own children only", () => {
  it("parent A1 sees themselves and their child, not another family's child on the same team", async () => {
    const ids = await idsAs(U.parentA1, "people");
    expect(ids.sort()).toEqual([P.guardianA1, P.childA1].sort());
  });

  it("parent A1 sees only their child's registration, consents and fees", async () => {
    expect(await idsAs(U.parentA1, "registrations", "player_person_id")).toEqual([P.childA1]);
    expect(await idsAs(U.parentA1, "consents", "person_id")).toEqual([P.childA1]);
    expect(await idsAs(U.parentA1, "fees", "person_id")).toEqual([P.childA1]);
  });

  it("parent A1 can read their own child's sensitive details but not another child's", async () => {
    const r = await runAs(as.user(U.parentA1), async (q) => (await q.query("select * from public.get_person_sensitive($1)", [P.childA1])).rows[0]);
    expect(r.emergency_name).toBe("Aunt One");
    await expectDenied(runAs(as.user(U.parentA1), (q) => q.query("select * from public.get_person_sensitive($1)", [P.childA2])));
  });

  it("parent A1 sees their child's team events and club-wide events only", async () => {
    const ids = await idsAs(U.parentA1, "events");
    expect(ids.sort()).toEqual([E.teamA1Training, E.clubWideA].sort());
  });

  it("parent A1 sees only their own guardianship and their own submissions", async () => {
    expect(await idsAs(U.parentA1, "guardianships", "child_person_id")).toEqual([P.childA1]);
    expect(await countAs(as.user(U.parentA1), "submissions")).toBe(1);
  });

  it("parent A1 cannot add people, mark attendance, read coach notes or change fees", async () => {
    await expectDenied(runAs(as.user(U.parentA1), (q) => q.query("insert into public.people (club_id, kind, first_name) values ($1, 'player', 'Extra')", [C.A])));
    await expectDenied(
      runAs(as.user(U.parentA1), (q) =>
        q.query("insert into public.attendance (club_id, event_id, person_id, present) values ($1, $2, $3, true)", [C.A, E.teamA1Training, P.childA1]),
      ),
    );
    expect(await countAs(as.user(U.parentA1), "coach_notes")).toBe(0);
    const n = await runAs(as.user(U.parentA1), async (q) => (await q.query("update public.fees set status = 'paid' where person_id = $1", [P.childA1])).rowCount);
    expect(n).toBe(0);
  });

  it("parent A1 can set availability for their child but not for another child", async () => {
    await runAs(as.user(U.parentA1), (q) =>
      q.query("update public.availability set status = 'out' where event_id = $1 and person_id = $2", [E.teamA1Training, P.childA1]),
    );
    const n = await runAs(
      as.user(U.parentA1),
      async (q) => (await q.query("update public.availability set status = 'out' where event_id = $1 and person_id = $2", [E.teamA1Training, P.childA2])).rowCount,
    );
    expect(n).toBe(0);
  });

  it("parent A1 can update their own contact details but not their child's record", async () => {
    const own = await runAs(as.user(U.parentA1), async (q) => (await q.query("update public.people set mobile = '0400 111 222' where id = $1", [P.guardianA1])).rowCount);
    const child = await runAs(as.user(U.parentA1), async (q) => (await q.query("update public.people set dob = '2010-01-01' where id = $1", [P.childA1])).rowCount);
    expect(own).toBe(1);
    expect(child).toBe(0);
  });
});

describe("player login (13+): self only", () => {
  it("sees only their own person row, fees and ratings", async () => {
    expect(await idsAs(U.playerA1, "people")).toEqual([P.childA1]);
    expect(await idsAs(U.playerA1, "fees", "person_id")).toEqual([P.childA1]);
    expect(await idsAs(U.playerA1, "skill_ratings", "person_id")).toEqual([P.childA1]);
    expect(await countAs(as.user(U.playerA1), "coach_notes")).toBe(0);
  });
  it("cannot read their own medical details (guardians and coaches only)", async () => {
    await expectDenied(runAs(as.user(U.playerA1), (q) => q.query("select * from public.get_person_sensitive($1)", [P.childA1])));
  });
  it("cannot mark fees paid", async () => {
    const n = await runAs(as.user(U.playerA1), async (q) => (await q.query("update public.fees set status = 'paid' where person_id = $1", [P.childA1])).rowCount);
    expect(n).toBe(0);
  });
});

describe("admin: everything in their club", () => {
  it("sees every person in the club and none outside it", async () => {
    const ids = await idsAs(U.adminA, "people");
    expect(ids.sort()).toEqual([P.coachA, P.coachA2, P.guardianA1, P.childA1, P.guardianA2, P.childA2, P.childA3].sort());
  });
  it("can archive a person and the archive is audited", async () => {
    const audited = await runAs(as.user(U.adminA), async (q) => {
      await q.query("update public.people set archived_at = now() where id = $1", [P.childA3]);
      await q.query("reset role");
      return (await q.query("select count(*)::int as n from public.audit_log where action = 'person.archive' and target_id = $1 and actor_user_id = $2", [P.childA3, U.adminA])).rows[0].n;
    });
    expect(audited).toBe(1);
  });
  it("cannot delete people (archive only)", async () => {
    const n = await runAs(as.user(U.adminA), async (q) => (await q.query("delete from public.people where id = $1", [P.childA3])).rowCount);
    expect(n).toBe(0);
  });
  it("cannot change a consent once recorded", async () => {
    const n = await runAs(as.user(U.adminA), async (q) => (await q.query("update public.consents set granted = false where club_id = $1", [C.A])).rowCount);
    expect(n).toBe(0);
  });
  it("cannot remove themselves from the club", async () => {
    const n = await runAs(as.user(U.adminA), async (q) => (await q.query("delete from public.club_users where user_id = $1", [U.adminA])).rowCount);
    expect(n).toBe(0);
  });
  it("cannot write to subscriptions (Stripe webhook only)", async () => {
    const n = await runAs(as.user(U.adminA), async (q) => (await q.query("update public.subscriptions set status = 'active' where club_id = $1", [C.A])).rowCount);
    expect(n).toBe(0);
  });
  it("sees roster membership for every team", async () => {
    const teams = await idsAs(U.adminA, "team_members", "team_id");
    expect(new Set(teams)).toEqual(new Set([T.A1, T.A2]));
  });
});
