import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client, Pool, type PoolClient } from "pg";

export const DB_URL =
  process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export const U = {
  adminA: "a0000000-0000-4000-8000-000000000001",
  coachA: "a0000000-0000-4000-8000-000000000002",
  coachA2: "a0000000-0000-4000-8000-000000000003",
  parentA1: "a0000000-0000-4000-8000-000000000004",
  parentA2: "a0000000-0000-4000-8000-000000000005",
  playerA1: "a0000000-0000-4000-8000-000000000006",
  adminB: "a0000000-0000-4000-8000-000000000011",
  coachB: "a0000000-0000-4000-8000-000000000012",
  parentB: "a0000000-0000-4000-8000-000000000013",
  newbie: "a0000000-0000-4000-8000-000000000077",
  owner: "a0000000-0000-4000-8000-000000000099",
} as const;

export const C = {
  A: "c0000000-0000-4000-8000-000000000001",
  B: "c0000000-0000-4000-8000-000000000002",
} as const;

export const P = {
  coachA: "90000000-0000-4000-8000-000000000001",
  coachA2: "90000000-0000-4000-8000-000000000002",
  guardianA1: "90000000-0000-4000-8000-000000000003",
  childA1: "90000000-0000-4000-8000-000000000004",
  guardianA2: "90000000-0000-4000-8000-000000000005",
  childA2: "90000000-0000-4000-8000-000000000006",
  childA3: "90000000-0000-4000-8000-000000000007",
  coachB: "90000000-0000-4000-8000-000000000011",
  guardianB: "90000000-0000-4000-8000-000000000012",
  childB: "90000000-0000-4000-8000-000000000013",
} as const;

export const T = {
  A1: "70000000-0000-4000-8000-000000000001",
  A2: "70000000-0000-4000-8000-000000000002",
  B1: "70000000-0000-4000-8000-000000000003",
} as const;

export const S = {
  A: "50000000-0000-4000-8000-000000000001",
  B: "50000000-0000-4000-8000-000000000002",
} as const;

export const E = {
  teamA1Training: "30000000-0000-4000-8000-000000000001",
  teamA2Game: "30000000-0000-4000-8000-000000000002",
  clubWideA: "30000000-0000-4000-8000-000000000003",
  teamB1: "30000000-0000-4000-8000-000000000011",
} as const;

const pool = new Pool({ connectionString: DB_URL, max: 4 });

export async function loadFixture() {
  const sql = readFileSync(join(__dirname, "fixture.sql"), "utf8");
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query(sql);
  } finally {
    await c.end();
  }
}

export type Actor = { role: "authenticated"; uid: string } | { role: "anon" } | { role: "service_role" };

export const as = {
  user: (uid: string): Actor => ({ role: "authenticated", uid }),
  anon: { role: "anon" } as Actor,
  service: { role: "service_role" } as Actor,
};

/**
 * Runs `fn` inside a transaction as the given actor, exactly the way PostgREST
 * would: the Postgres role is switched and the JWT claims are set as
 * transaction-local settings. The transaction is rolled back afterwards so
 * tests never leak state.
 */
export async function runAs<T>(actor: Actor, fn: (q: PoolClient) => Promise<T>, opts: { commit?: boolean } = {}) {
  const client = await pool.connect();
  try {
    await client.query("begin");
    await client.query(`set local role ${actor.role}`);
    if (actor.role === "authenticated") {
      const claims = JSON.stringify({ sub: actor.uid, role: "authenticated" });
      await client.query("select set_config('request.jwt.claim.sub', $1, true)", [actor.uid]);
      await client.query("select set_config('request.jwt.claim.role', 'authenticated', true)");
      await client.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    } else if (actor.role === "anon") {
      await client.query("select set_config('request.jwt.claim.role', 'anon', true)");
    }
    const out = await fn(client);
    await client.query(opts.commit ? "commit" : "rollback");
    return out;
  } catch (e) {
    await client.query("rollback").catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

export async function countAs(actor: Actor, table: string, where = "true", params: unknown[] = []) {
  return runAs(actor, async (q) => {
    const r = await q.query(`select count(*)::int as n from public.${table} where ${where}`, params);
    return r.rows[0].n as number;
  });
}

/** Rows visible per club, as seen by the actor. */
export async function clubSplit(actor: Actor, table: string) {
  const col = table === "clubs" ? "id" : "club_id";
  return runAs(actor, async (q) => {
    const r = await q.query(
      `select count(*) filter (where ${col} = $1)::int as a, count(*) filter (where ${col} = $2)::int as b, count(*)::int as total from public.${table}`,
      [C.A, C.B],
    );
    return r.rows[0] as { a: number; b: number; total: number };
  });
}

export async function expectDenied(p: Promise<unknown>) {
  try {
    await p;
  } catch (e) {
    const code = (e as { code?: string }).code;
    if (code === "42501") return; // insufficient_privilege (RLS with check / raised in our functions)
    throw e;
  }
  throw new Error("expected the statement to be denied");
}

export async function closePool() {
  await pool.end();
}
