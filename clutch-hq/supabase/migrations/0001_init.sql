-- Clutch Basketball · shared database for Clutch HQ (staff) and the Clutch app (families).
--
-- Every table has row-level security. The rules, in plain words:
--   admin   sees and changes everything
--   coach   sees their own teams: players, families, roll, availability, notes
--   parent  sees their own family only: their kids, fees, threads
--   player  sees their own family, and can message only inside it (plus a
--           coach thread that always includes their parents)
--   pending an account that isn't linked to anyone yet sees nothing
--
-- Community board posts and comments are held until an admin approves them.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- types
create type app_role as enum ('admin', 'coach', 'parent', 'player', 'pending');
create type mod_status as enum ('pending', 'approved', 'rejected');
create type conv_kind as enum ('family', 'coach', 'club');

-- ---------------------------------------------------------------- club
create table org_settings (
  id            int primary key default 1 check (id = 1),
  name          text not null default 'Clutch Basketball',
  contact_name  text not null default 'Camille Allam',
  email         text not null default 'admin@clutchbasketball.com.au',
  phone         text not null default '0404 000 113',
  base          text not null default 'Padstow, NSW',
  season        jsonb not null default '{}'::jsonb,   -- {name, start, end, ageYear}
  tryout        jsonb not null default '{}'::jsonb,   -- {date, time, venue}
  min_roster    int not null default 7,
  min_game      int not null default 5,
  prayer        boolean not null default true,
  guidelines    text not null default '',
  updated_at    timestamptz not null default now()
);

create table venues (
  id      uuid primary key default gen_random_uuid(),
  name    text not null,
  short   text not null,
  courts  int not null default 1
);

create table coaches (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null default 'Coach',
  phone       text not null default '',
  email       text,                       -- the email they activate with
  wwcc_no     text,
  wwcc_exp    date,
  profile_id  uuid,                       -- set once they've activated
  created_at  timestamptz not null default now()
);
create unique index coaches_email_key on coaches (lower(email)) where email is not null;

create table teams (
  id        uuid primary key default gen_random_uuid(),
  age       text not null,                -- U12, U14, U16, U18, Open
  div       text not null,
  comp      text not null default '',
  coach_id  uuid references coaches(id) on delete set null,
  asst_id   uuid references coaches(id) on delete set null,
  cap       int not null default 10,
  fee       numeric(8,2) not null default 0,
  train     jsonb not null default '[]'::jsonb,  -- [{dow,start,end,venue,court}]
  game      jsonb not null default '{}'::jsonb,  -- {dow,venue,time}
  created   date not null default current_date,
  archived  boolean not null default false
);

-- ---------------------------------------------------------------- people
create table families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,              -- "Hijazi family"
  created_at  timestamptz not null default now()
);

create table guardians (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references families(id) on delete cascade,
  name        text not null,
  rel         text not null default 'Parent',
  phone       text not null default '',
  email       text,
  profile_id  uuid,
  created_at  timestamptz not null default now()
);
create unique index guardians_email_key on guardians (lower(email)) where email is not null;

create table players (
  id            uuid primary key default gen_random_uuid(),
  family_id     uuid not null references families(id) on delete cascade,
  first_name    text not null,
  last_name     text not null,
  dob           date not null,
  phone         text not null default '',
  team_id       uuid references teams(id) on delete set null,
  no            int,
  pos           text not null default '',
  joined        date not null default current_date,
  source        text not null default '',
  medical       boolean not null default false,
  medical_note  text not null default '',
  photo_consent boolean not null default true,
  status        text not null default 'active',   -- active | left
  profile_id    uuid,
  created_at    timestamptz not null default now()
);
create index players_team_idx on players (team_id);
create index players_family_idx on players (family_id);

create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         app_role not null default 'pending',
  full_name    text not null default '',
  coach_id     uuid references coaches(id) on delete set null,
  guardian_id  uuid references guardians(id) on delete set null,
  player_id    uuid references players(id) on delete set null,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------- season
create table fixtures (
  id        uuid primary key default gen_random_uuid(),
  team_id   uuid not null references teams(id) on delete cascade,
  date      date not null,
  time      text not null,                -- "18:00"
  venue_id  uuid references venues(id) on delete set null,
  court     int not null default 1,
  opp       text not null default 'To be drawn',
  round     int,
  us        int,
  them      int
);
create index fixtures_team_date_idx on fixtures (team_id, date);

-- A session key is "<team_id>|<date>|T0" for training or "<team_id>|<date>|G" for a game.
create table availability (
  session_key text not null,
  player_id   uuid not null references players(id) on delete cascade,
  status      text not null check (status in ('in', 'out')),
  set_by      uuid,
  updated_at  timestamptz not null default now(),
  primary key (session_key, player_id)
);

create table roll (
  session_key text not null,
  player_id   uuid not null references players(id) on delete cascade,
  present     boolean not null,
  taken_by    uuid,
  taken_at    timestamptz not null default now(),
  primary key (session_key, player_id)
);

create table payments (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  amount      numeric(8,2) not null,
  paid_on     date not null default current_date,
  method      text not null default 'Bank transfer',
  recorded_by uuid,
  created_at  timestamptz not null default now()
);

create table player_notes (                -- coach notes, staff only
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  body       text not null,
  by_name    text not null default '',
  created_at timestamptz not null default now()
);

create table player_log (                  -- history the family can see too
  id         uuid primary key default gen_random_uuid(),
  player_id  uuid not null references players(id) on delete cascade,
  on_date    date not null default current_date,
  body       text not null
);

create table registrations (
  id         uuid primary key default gen_random_uuid(),
  at         timestamptz not null default now(),
  stage      text not null default 'new',   -- new contacted tryout offered notnow joined
  first_name text not null,
  last_name  text not null,
  phone      text not null default '',
  dob        date,
  gname      text not null default '',
  gphone     text not null default '',
  gemail     text not null default '',
  msg        text not null default '',
  tryout     jsonb,
  log        jsonb not null default '[]'::jsonb,
  player_id  uuid references players(id) on delete set null
);

create table tasks (
  id         uuid primary key default gen_random_uuid(),
  body       text not null,
  who        text not null default '',
  due        date,
  done       boolean not null default false,
  created_at timestamptz not null default now()
);

create table notices (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade,   -- null = everyone
  title      text not null,
  body       text not null default '',
  by_name    text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- codes
-- Activation codes get a parent, coach or admin into their account for the
-- first time (email + code + a password they choose). Kid codes let a player
-- sign in on their own device. Only hashes are stored.
create table activation_codes (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('guardian', 'coach', 'admin')),
  target_id   uuid,
  email       text not null,
  code_hash   text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create table player_codes (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references players(id) on delete cascade,
  code_hash   text not null,
  expires_at  timestamptz not null,
  used_at     timestamptz,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- messaging
create table conversations (
  id              uuid primary key default gen_random_uuid(),
  kind            conv_kind not null,
  family_id       uuid references families(id) on delete cascade,
  team_id         uuid references teams(id) on delete cascade,
  created_at      timestamptz not null default now(),
  last_message_at timestamptz,
  last_preview    text not null default ''
);
create unique index conversations_family_key on conversations (kind, family_id) where kind in ('family', 'club');
create unique index conversations_coach_key  on conversations (kind, family_id, team_id) where kind = 'coach';

create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id       uuid not null,
  sender_name     text not null default '',
  sender_role     app_role not null default 'pending',
  body            text not null check (length(body) between 1 and 4000),
  created_at      timestamptz not null default now()
);
create index messages_conv_idx on messages (conversation_id, created_at);

create table conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id      uuid not null,
  last_read_at    timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

-- ---------------------------------------------------------------- board
create table posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null,
  author_name  text not null default '',
  author_role  app_role not null default 'pending',
  body         text not null check (length(body) between 1 and 4000),
  status       mod_status not null default 'pending',
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  author_id    uuid not null,
  author_name  text not null default '',
  author_role  app_role not null default 'pending',
  body         text not null check (length(body) between 1 and 2000),
  status       mod_status not null default 'pending',
  reviewed_by  uuid,
  reviewed_at  timestamptz,
  created_at   timestamptz not null default now()
);

create table post_likes (
  post_id     uuid not null references posts(id) on delete cascade,
  profile_id  uuid not null,
  created_at  timestamptz not null default now(),
  primary key (post_id, profile_id)
);

-- ---------------------------------------------------------------- who am I
-- These run as the table owner, so they can read profiles without tripping
-- the policies on profiles themselves.
create or replace function my_role() returns app_role
language sql stable security definer set search_path = public as $$
  select coalesce((select role from profiles where id = auth.uid()), 'pending'::app_role);
$$;

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach'));
$$;

create or replace function my_coach_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coach_id from profiles where id = auth.uid();
$$;

create or replace function my_player_id() returns uuid
language sql stable security definer set search_path = public as $$
  select player_id from profiles where id = auth.uid();
$$;

create or replace function my_family_id() returns uuid
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select g.family_id from profiles p join guardians g on g.id = p.guardian_id where p.id = auth.uid()),
    (select pl.family_id from profiles p join players pl on pl.id = p.player_id where p.id = auth.uid()));
$$;

-- Teams this coach runs (an admin who also coaches gets theirs too).
create or replace function coach_team_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select t.id from teams t, profiles p
  where p.id = auth.uid() and p.coach_id is not null
    and (t.coach_id = p.coach_id or t.asst_id = p.coach_id);
$$;

-- Teams my family's players are on.
create or replace function family_team_ids() returns setof uuid
language sql stable security definer set search_path = public as $$
  select distinct team_id from players where family_id = my_family_id() and team_id is not null and status = 'active';
$$;

create or replace function coach_can_see_player(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = pid and team_id in (select coach_team_ids()));
$$;

create or replace function coach_can_see_family(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where family_id = fid and team_id in (select coach_team_ids()));
$$;

create or replace function player_in_my_family(pid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from players where id = pid and family_id = my_family_id());
$$;

create or replace function session_team(key text) returns uuid
language sql immutable as $$
  select nullif(split_part(key, '|', 1), '')::uuid;
$$;

-- Who can read (and write in) a conversation.
create or replace function can_see_conversation(c conversations) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare r app_role := my_role();
begin
  if c.kind = 'family' then
    return c.family_id = my_family_id();
  elsif c.kind = 'club' then
    return r = 'admin' or (r = 'parent' and c.family_id = my_family_id());
  elsif c.kind = 'coach' then
    return r = 'admin'
      or (r = 'coach' and c.team_id in (select coach_team_ids()))
      or (r = 'parent' and c.family_id = my_family_id())
      or (r = 'player' and c.family_id = my_family_id()
          and exists (select 1 from players where id = my_player_id() and team_id = c.team_id));
  end if;
  return false;
end $$;

-- ---------------------------------------------------------------- auth hook
-- A new auth user gets a profile. Accounts created by the activation
-- functions carry their role in app_metadata; anyone else is 'pending'.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare md jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
begin
  insert into profiles (id, role, full_name, coach_id, guardian_id, player_id)
  values (new.id,
    coalesce((md->>'role')::app_role, 'pending'),
    coalesce(md->>'full_name', ''),
    nullif(md->>'coach_id', '')::uuid,
    nullif(md->>'guardian_id', '')::uuid,
    nullif(md->>'player_id', '')::uuid)
  on conflict (id) do update set
    role = excluded.role, full_name = excluded.full_name,
    coach_id = excluded.coach_id, guardian_id = excluded.guardian_id, player_id = excluded.player_id;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Stamp who wrote a message / post / comment, and hold non-admin content for approval.
create or replace function stamp_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.sender_id := auth.uid();
  new.sender_name := coalesce(p.full_name, '');
  new.sender_role := coalesce(p.role, 'pending');
  update conversations set last_message_at = now(), last_preview = left(new.body, 120) where id = new.conversation_id;
  return new;
end $$;
create trigger messages_stamp before insert on messages for each row execute function stamp_message();

create or replace function stamp_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(p.full_name, '');
  new.author_role := coalesce(p.role, 'pending');
  if p.role = 'admin' then
    new.status := coalesce(new.status, 'approved'); new.reviewed_by := auth.uid(); new.reviewed_at := now();
  else
    new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null;
  end if;
  return new;
end $$;
create trigger posts_stamp before insert on posts for each row execute function stamp_post();
create trigger comments_stamp before insert on comments for each row execute function stamp_post();

-- ---------------------------------------------------------------- codes (RPC)
create or replace function gen_code(n int) returns text
language sql volatile as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, n);
$$;

-- Admin: make an activation code for a parent, coach or admin. Returns the plain code once.
create or replace function create_activation_code(p_kind text, p_target uuid, p_email text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare code text;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_kind not in ('guardian', 'coach', 'admin') then raise exception 'bad kind'; end if;
  code := gen_code(8);
  update activation_codes set used_at = now() where lower(email) = lower(p_email) and used_at is null;
  insert into activation_codes (kind, target_id, email, code_hash, expires_at, created_by)
  values (p_kind, p_target, lower(trim(p_email)), crypt(code, gen_salt('bf', 8)), now() + interval '14 days', auth.uid());
  return code;
end $$;

-- Parent (or admin): make a sign-in code for one of their kids. Six digits, 7 days, one use.
create or replace function create_player_code(p_player uuid)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare code text;
begin
  if not (is_admin() or (my_role() = 'parent' and player_in_my_family(p_player))) then
    raise exception 'not your player';
  end if;
  code := lpad((floor(random() * 1000000))::int::text, 6, '0');
  update player_codes set used_at = now() where player_id = p_player and used_at is null;
  insert into player_codes (player_id, code_hash, expires_at, created_by)
  values (p_player, crypt(code, gen_salt('bf', 8)), now() + interval '7 days', auth.uid());
  return code;
end $$;

-- Open (or create) a thread. Same permission rule as reading it.
create or replace function open_conversation(p_kind conv_kind, p_family uuid, p_team uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare c conversations; cid uuid;
begin
  if p_kind = 'coach' then
    select * into c from conversations where kind = 'coach' and family_id = p_family and team_id = p_team;
  else
    select * into c from conversations where kind = p_kind and family_id = p_family;
  end if;
  if c.id is null then
    c.id := gen_random_uuid(); c.kind := p_kind; c.family_id := p_family; c.team_id := case when p_kind = 'coach' then p_team end;
    if not can_see_conversation(c) then raise exception 'no access'; end if;
    insert into conversations (id, kind, family_id, team_id) values (c.id, c.kind, c.family_id, c.team_id);
    return c.id;
  end if;
  if not can_see_conversation(c) then raise exception 'no access'; end if;
  return c.id;
end $$;

-- Service role only: look up an auth user by email (used by the activation functions).
create or replace function user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;
revoke execute on function user_id_by_email(text) from public, anon, authenticated;

-- ---------------------------------------------------------------- views
-- Names families are allowed to see, without phone numbers or checks.
create view coaches_public with (security_invoker = false) as
  select id, name, role from coaches;
grant select on coaches_public to authenticated;

-- ---------------------------------------------------------------- RLS
alter table org_settings      enable row level security;
alter table venues            enable row level security;
alter table coaches           enable row level security;
alter table teams             enable row level security;
alter table families          enable row level security;
alter table guardians         enable row level security;
alter table players           enable row level security;
alter table profiles          enable row level security;
alter table fixtures          enable row level security;
alter table availability      enable row level security;
alter table roll              enable row level security;
alter table payments          enable row level security;
alter table player_notes      enable row level security;
alter table player_log        enable row level security;
alter table registrations     enable row level security;
alter table tasks             enable row level security;
alter table notices           enable row level security;
alter table activation_codes  enable row level security;
alter table player_codes      enable row level security;
alter table conversations     enable row level security;
alter table messages          enable row level security;
alter table conversation_reads enable row level security;
alter table posts             enable row level security;
alter table comments          enable row level security;
alter table post_likes        enable row level security;

-- club-wide, read by anyone signed in and linked
create policy org_read   on org_settings for select to authenticated using (my_role() <> 'pending');
create policy org_admin  on org_settings for update to authenticated using (is_admin()) with check (is_admin());
create policy venues_read on venues for select to authenticated using (my_role() <> 'pending');
create policy venues_admin on venues for all to authenticated using (is_admin()) with check (is_admin());
create policy teams_read on teams for select to authenticated using (my_role() <> 'pending');
create policy teams_admin on teams for all to authenticated using (is_admin()) with check (is_admin());
create policy fixtures_read on fixtures for select to authenticated using (my_role() <> 'pending');
create policy fixtures_admin on fixtures for all to authenticated using (is_admin()) with check (is_admin());
create policy fixtures_coach_score on fixtures for update to authenticated
  using (team_id in (select coach_team_ids())) with check (team_id in (select coach_team_ids()));

create policy coaches_staff on coaches for select to authenticated using (is_staff());
create policy coaches_admin on coaches for all to authenticated using (is_admin()) with check (is_admin());
create policy coaches_self on coaches for update to authenticated using (id = my_coach_id()) with check (id = my_coach_id());

create policy profiles_read on profiles for select to authenticated
  using (id = auth.uid() or is_admin() or role in ('admin', 'coach'));
create policy profiles_self on profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid() and role = my_role());

create policy families_read on families for select to authenticated
  using (is_admin() or id = my_family_id() or (my_role() = 'coach' and coach_can_see_family(id)));
create policy families_admin on families for all to authenticated using (is_admin()) with check (is_admin());

create policy guardians_read on guardians for select to authenticated
  using (is_admin() or family_id = my_family_id() or (my_role() = 'coach' and coach_can_see_family(family_id)));
create policy guardians_admin on guardians for all to authenticated using (is_admin()) with check (is_admin());
create policy guardians_self on guardians for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and family_id = my_family_id());

create policy players_read on players for select to authenticated
  using (is_admin() or family_id = my_family_id() or (my_role() = 'coach' and coach_can_see_player(id)));
create policy players_admin on players for all to authenticated using (is_admin()) with check (is_admin());

create policy availability_read on availability for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or (my_role() = 'coach' and coach_can_see_player(player_id)));
create policy availability_write on availability for all to authenticated
  using (is_admin() or player_in_my_family(player_id) or (my_role() = 'coach' and coach_can_see_player(player_id)))
  with check (is_admin() or player_in_my_family(player_id) or (my_role() = 'coach' and coach_can_see_player(player_id)));

create policy roll_read on roll for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or (my_role() = 'coach' and coach_can_see_player(player_id)));
create policy roll_write on roll for all to authenticated
  using (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)))
  with check (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)));

create policy payments_read on payments for select to authenticated
  using (is_admin() or (my_role() = 'parent' and player_in_my_family(player_id)));
create policy payments_admin on payments for all to authenticated using (is_admin()) with check (is_admin());

create policy notes_staff on player_notes for all to authenticated
  using (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)))
  with check (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)));

create policy log_read on player_log for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or (my_role() = 'coach' and coach_can_see_player(player_id)));
create policy log_staff on player_log for insert to authenticated
  with check (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)));

create policy regs_admin on registrations for all to authenticated using (is_admin()) with check (is_admin());
create policy tasks_staff on tasks for all to authenticated using (is_staff()) with check (is_staff());

create policy notices_read on notices for select to authenticated
  using (is_staff() or team_id is null or team_id in (select family_team_ids()));
create policy notices_admin on notices for all to authenticated using (is_admin()) with check (is_admin());
create policy notices_coach on notices for insert to authenticated with check (team_id in (select coach_team_ids()));

create policy codes_admin on activation_codes for select to authenticated using (is_admin());
create policy pcodes_read on player_codes for select to authenticated
  using (is_admin() or (my_role() = 'parent' and player_in_my_family(player_id)));

create policy conv_read on conversations for select to authenticated using (can_see_conversation(conversations));
create policy msg_read on messages for select to authenticated
  using (exists (select 1 from conversations c where c.id = conversation_id and can_see_conversation(c)));
create policy msg_write on messages for insert to authenticated
  with check (my_role() <> 'pending' and exists (select 1 from conversations c where c.id = conversation_id and can_see_conversation(c)));
create policy msg_admin_delete on messages for delete to authenticated using (is_admin());
create policy reads_own on conversation_reads for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy posts_read on posts for select to authenticated
  using (my_role() <> 'pending' and (status = 'approved' or author_id = auth.uid() or is_admin()));
create policy posts_write on posts for insert to authenticated with check (my_role() <> 'pending');
create policy posts_admin on posts for update to authenticated using (is_admin()) with check (is_admin());
create policy posts_delete on posts for delete to authenticated using (is_admin() or (author_id = auth.uid() and status = 'pending'));

create policy comments_read on comments for select to authenticated
  using (my_role() <> 'pending' and (is_admin() or author_id = auth.uid()
         or (status = 'approved' and exists (select 1 from posts p where p.id = post_id and p.status = 'approved'))));
create policy comments_write on comments for insert to authenticated
  with check (my_role() <> 'pending' and exists (select 1 from posts p where p.id = post_id and p.status = 'approved'));
create policy comments_admin on comments for update to authenticated using (is_admin()) with check (is_admin());
create policy comments_delete on comments for delete to authenticated using (is_admin() or (author_id = auth.uid() and status = 'pending'));

create policy likes_read on post_likes for select to authenticated using (my_role() <> 'pending');
create policy likes_own on post_likes for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid() and my_role() <> 'pending');

-- ---------------------------------------------------------------- realtime
alter publication supabase_realtime add table messages, posts, comments, conversations;

-- ---------------------------------------------------------------- seed
insert into org_settings (id, season, guidelines) values (1,
  jsonb_build_object('name', 'Season ' || extract(year from current_date)::int, 'start', current_date, 'end', current_date + 140, 'ageYear', extract(year from current_date)::int),
  'This board is for Clutch families, players and coaches only. Keep it positive and about the club. No phone numbers, addresses or photos of other people''s kids without their say-so. A Clutch admin reads every post and comment before it goes up.');

insert into coaches (name, role, email) values ('Camille Allam', 'Head coach · Finance · Admin', 'admin@clutchbasketball.com.au');
