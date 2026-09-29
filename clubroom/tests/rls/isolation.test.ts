import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { C, P, U, as, clubSplit, closePool, countAs, expectDenied, loadFixture, runAs } from "./db";

// Every club-owned table. Each has rows in both clubs in the fixture, so a
// count of zero for the other club is a real proof, not an empty table.
const CLUB_TABLES = [
  "clubs",
  "club_users",
  "invites",
  "venues",
  "seasons",
  "divisions",
  "teams",
  "people",
  "guardianships",
  "form_templates",
  "registrations",
  "consents",
  "team_members",
  "events",
  "availability",
  "attendance",
  "skill_ratings",
  "coach_notes",
  "level_config",
  "fees",
  "payments",
  "tasks",
  "notices",
  "submissions",
  "coach_clearances",
  "imports",
  "subscriptions",
  "audit_log",
];

beforeAll(async () => {
  await loadFixture();
});
afterAll(closePool);

describe("club isolation: an admin sees only their own club", () => {
  for (const table of CLUB_TABLES) {
    it(`${table}: admin A sees club A rows and zero club B rows`, async () => {
      const split = await clubSplit(as.user(U.adminA), table.replace("clubs", "clubs"));
      expect(split.b, `admin A saw ${split.b} rows of club B in ${table}`).toBe(0);
      expect(split.a, `admin A saw no rows of their own club in ${table}`).toBeGreaterThan(0);
      expect(split.total).toBe(split.a);
    });
  }

  it("the platform owner sees both clubs (and is audited when acting)", async () => {
    const split = await clubSplit(as.user(U.owner), "people");
    expect(split.a).toBeGreaterThan(0);
    expect(split.b).toBeGreaterThan(0);
  });

  it("anon sees nothing in any club-owned table", async () => {
    for (const table of CLUB_TABLES) {
      const n = await countAs(as.anon, table);
      expect(n, `anon saw ${n} rows in ${table}`).toBe(0);
    }
  });

  it("anon can read the public view of active clubs only", async () => {
    const rows = await runAs(as.anon, async (q) => (await q.query("select slug from public.club_public order by slug")).rows);
    expect(rows.map((r) => r.slug)).toEqual(expect.arrayContaining(["rls-club-a", "rls-club-b"]));
    const cols = await runAs(as.anon, async (q) =>
      (await q.query("select column_name from information_schema.columns where table_name = 'club_public'")).rows.map((r) => r.column_name),
    );
    expect(cols).not.toContain("contact_email");
    expect(cols).not.toContain("created_by");
  });
});

describe("club isolation: writes across clubs are refused", () => {
  it("admin B cannot update a person in club A (zero rows affected)", async () => {
    const n = await runAs(as.user(U.adminB), async (q) => {
      const r = await q.query("update public.people set school = 'Hacked' where id = $1", [P.childA1]);
      return r.rowCount;
    });
    expect(n).toBe(0);
  });

  it("admin B cannot insert a person into club A", async () => {
    await expectDenied(
      runAs(as.user(U.adminB), (q) =>
        q.query("insert into public.people (club_id, kind, first_name) values ($1, 'player', 'Intruder')", [C.A]),
      ),
    );
  });

  it("admin B cannot insert a registration into club A", async () => {
    await expectDenied(
      runAs(as.user(U.adminB), (q) =>
        q.query("insert into public.registrations (club_id, player_person_id) values ($1, $2)", [C.A, P.childA1]),
      ),
    );
  });

  it("admin B cannot change club A's settings", async () => {
    const n = await runAs(as.user(U.adminB), async (q) => (await q.query("update public.clubs set name = 'X' where id = $1", [C.A])).rowCount);
    expect(n).toBe(0);
  });

  it("admin B cannot read club A's audited sensitive details", async () => {
    await expectDenied(runAs(as.user(U.adminB), (q) => q.query("select * from public.get_person_sensitive($1)", [P.childA1])));
  });

  it("admin B cannot accept an invite meant for club A with a guessed token", async () => {
    await expect(runAs(as.user(U.adminB), (q) => q.query("select public.accept_invite('wrong-token')"))).rejects.toThrow(/not found/);
  });
});

describe("sensitive data is never readable directly", () => {
  it("even a club admin gets zero rows selecting person_sensitive", async () => {
    expect(await countAs(as.user(U.adminA), "person_sensitive")).toBe(0);
  });
  it("a coach gets zero rows selecting person_sensitive", async () => {
    expect(await countAs(as.user(U.coachA), "person_sensitive")).toBe(0);
  });
  it("a parent gets zero rows selecting person_sensitive", async () => {
    expect(await countAs(as.user(U.parentA1), "person_sensitive")).toBe(0);
  });
});

describe("audit log is append-only", () => {
  it("admin cannot update or delete audit rows", async () => {
    const updated = await runAs(as.user(U.adminA), async (q) => (await q.query("update public.audit_log set action = 'x' where club_id = $1", [C.A])).rowCount);
    const deleted = await runAs(as.user(U.adminA), async (q) => (await q.query("delete from public.audit_log where club_id = $1", [C.A])).rowCount);
    expect(updated).toBe(0);
    expect(deleted).toBe(0);
  });
  it("admin cannot insert audit rows directly", async () => {
    await expectDenied(runAs(as.user(U.adminA), (q) => q.query("insert into public.audit_log (club_id, action) values ($1, 'forged')", [C.A])));
  });
  it("non-admins cannot read the audit log", async () => {
    expect(await countAs(as.user(U.coachA), "audit_log")).toBe(0);
    expect(await countAs(as.user(U.parentA1), "audit_log")).toBe(0);
  });
});
