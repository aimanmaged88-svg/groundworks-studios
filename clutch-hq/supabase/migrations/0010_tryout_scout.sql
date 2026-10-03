-- Tryout-day scouting board (clutch-hq.netlify.app/scout.html). One shared live
-- pad for every coach on the floor: no accounts, the link carries a long event
-- key and every read/write goes through key-checked RPCs — the table itself has
-- no anon policies. Entries close automatically at midnight Sydney on the day.
create table scout_notes (
  id         uuid primary key default gen_random_uuid(),
  grp        text not null,
  player     text not null,
  look       text not null default '',
  note       text not null default '',
  rating     int  not null check (rating between 1 and 3),
  coach      text not null default '',
  device     text not null,
  agreed     text[] not null default '{}',
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);
alter table scout_notes enable row level security;

create or replace function scout_open() returns boolean
language sql stable as $$ select now() < '2026-10-03 14:00:00+00'::timestamptz $$;

create or replace function scout_key_ok(p_key text) returns boolean
language sql stable as $$ select p_key = 'DAyce3Mtpwp3gBi-5bVAXw' $$;

create or replace function scout_list(p_key text) returns setof scout_notes
language sql stable security definer set search_path = public as $$
  select * from scout_notes where scout_key_ok(p_key) and not hidden order by created_at desc;
$$;

create or replace function scout_add(p_key text, p_grp text, p_player text, p_look text, p_note text, p_rating int, p_coach text, p_device text)
returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if not scout_key_ok(p_key) then raise exception 'bad key'; end if;
  if not scout_open() then raise exception 'The board is closed — tryouts are done.'; end if;
  if (select count(*) from scout_notes) >= 800 then raise exception 'Board is full'; end if;
  if length(trim(p_player)) < 1 then raise exception 'Who stood out?'; end if;
  insert into scout_notes (grp, player, look, note, rating, coach, device)
  values (left(trim(p_grp), 10), left(trim(p_player), 80), left(trim(p_look), 120),
          left(trim(p_note), 300), greatest(1, least(3, p_rating)), left(trim(p_coach), 40), left(p_device, 40))
  returning id into rid;
  return rid;
end $$;

create or replace function scout_agree(p_key text, p_id uuid, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not scout_key_ok(p_key) then raise exception 'bad key'; end if;
  if not scout_open() then raise exception 'closed'; end if;
  update scout_notes set agreed = array_append(agreed, left(p_device, 40))
  where id = p_id and not (left(p_device, 40) = any(agreed)) and coalesce(array_length(agreed, 1), 0) < 50;
end $$;

create or replace function scout_del(p_key text, p_id uuid, p_device text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not scout_key_ok(p_key) then raise exception 'bad key'; end if;
  -- soft-hide: only the device that wrote the entry can retract it
  update scout_notes set hidden = true where id = p_id and device = left(p_device, 40);
end $$;

revoke execute on function scout_key_ok(text) from public, anon, authenticated;
grant execute on function scout_list(text) to anon, authenticated;
grant execute on function scout_add(text, text, text, text, text, int, text, text) to anon, authenticated;
grant execute on function scout_agree(text, uuid, text) to anon, authenticated;
grant execute on function scout_del(text, uuid, text) to anon, authenticated;
