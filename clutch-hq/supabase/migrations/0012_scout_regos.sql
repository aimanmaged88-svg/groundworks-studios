-- Tryout board: "Our registrations" — the registered kids, readable from the
-- key-gated board so coaches can see who's meant to be there. Names, age and
-- pipeline stage only; parent contact details stay off the shared page.
create or replace function scout_regos(p_key text)
returns table(first_name text, last_name text, dob date, stage text, gname text)
language sql stable security definer set search_path = public as $$
  select r.first_name, r.last_name, r.dob, r.stage, r.gname
  from registrations r
  where scout_key_ok(p_key) and not r.archived
  order by r.first_name, r.last_name;
$$;
grant execute on function scout_regos(text) to anon, authenticated;
