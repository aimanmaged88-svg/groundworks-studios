import { Client } from "pg";

const DB_URL = process.env.SUPABASE_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

export async function sql<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const c = new Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const r = await c.query(text, params);
    return r.rows as T[];
  } finally {
    await c.end();
  }
}

/** Creates a live club with a season, divisions and the default form, straight in the database. Synthetic only. */
export async function seedLiveClub(stamp: string) {
  const slug = `e2e-public-${stamp}`;
  const rows = await sql<{ id: string }>(
    `with c as (
       insert into public.clubs (slug, name, short_name, sport_key, status, suburb, state, colours, instagram_handle)
       values ($1, $2, 'Publics', 'basketball', 'active', 'Bankstown', 'NSW', '{"primary":"#f25c05","accent":"#0e2a47","on_primary":"#14120a"}', 'e2epublics')
       returning id
     ), f as (
       insert into public.form_templates (club_id, version, fields, consents, collection_notice, is_active, published_at)
       select id, 1, app.default_form_fields(), app.default_consents(), 'We collect this to run the season. It stays with the club.', true, now() from c
     ), s as (
       insert into public.seasons (club_id, name, age_rule_mode, age_cutoff_date, fee_cents, fee_label, registration_open, is_current)
       select id, 'Summer 2026/27', 'age_at_date', '2026-12-31', 18000, 'per player, per season', true, true from c returning id, club_id
     ), d as (
       insert into public.divisions (club_id, season_id, name, sort, min_age, max_age)
       select s.club_id, s.id, v.name, v.sort, v.min_age, v.max_age from s,
         (values ('U10',1,null::int,9),('U12',2,10,11),('U14',3,12,13),('U16',4,14,15),('U18',5,16,17)) as v(name,sort,min_age,max_age)
     )
     select id from c`,
    [slug, `E2E Publics ${stamp}`],
  );
  return { slug, clubId: rows[0].id };
}

export async function deleteClub(clubId: string) {
  await sql("delete from public.clubs where id = $1", [clubId]);
}
