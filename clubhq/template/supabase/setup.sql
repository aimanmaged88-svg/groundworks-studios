-- ============================================================
-- ClubHQ · Supabase setup
-- One Supabase project per club. Run this whole file in the
-- SQL editor of a fresh project (new-club.mjs stamps the club
-- values at the bottom). Then deploy the five edge functions
-- in supabase/functions/ and create the first admin code:
--
--   select create_activation_code('admin', null, 'you@club.com');
--
-- (run that as service role / in the SQL editor, then sign in
-- at the staff app with "I have a code".)
-- ============================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------- enums ----------
create type app_role as enum ('admin','coach','parent','player','pending');
create type conv_kind as enum ('family','coach','club');
create type mod_status as enum ('pending','approved','rejected');

-- ---------- tables ----------
create table org_settings (
  id int primary key default 1 check (id = 1),
  name text not null default '{{CLUB_NAME}}',
  contact_name text not null default '{{CONTACT_NAME}}',
  email text not null default '{{CLUB_EMAIL}}',
  phone text not null default '{{CLUB_PHONE}}',
  base text not null default '{{CLUB_BASE}}',
  season jsonb not null default '{}'::jsonb,
  tryout jsonb not null default '{}'::jsonb,
  min_roster int not null default {{MIN_ROSTER}},
  min_game int not null default {{MIN_GAME}},
  prayer boolean not null default {{PRAYER_DEFAULT}},
  guidelines text not null default '',
  updated_at timestamptz not null default now()
);

create table venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short text not null,
  courts int not null default 1
);

create table families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table guardians (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  rel text not null default 'Parent',
  phone text not null default '',
  email text,
  profile_id uuid,
  created_at timestamptz not null default now()
);
create unique index guardians_email_key on guardians (lower(email)) where (email is not null);

create table coaches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null default 'Coach',
  phone text not null default '',
  email text,
  wwcc_no text,
  wwcc_exp date,
  profile_id uuid,
  created_at timestamptz not null default now()
);
create unique index coaches_email_key on coaches (lower(email)) where (email is not null);

create table teams (
  id uuid primary key default gen_random_uuid(),
  age text not null,
  div text not null,
  comp text not null default '',
  coach_id uuid references coaches(id) on delete set null,
  asst_id uuid references coaches(id) on delete set null,
  cap int not null default 10,
  fee numeric not null default 0,
  train jsonb not null default '[]'::jsonb,
  game jsonb not null default '{}'::jsonb,
  created date not null default current_date,
  archived boolean not null default false,
  coach_name text not null default '',
  asst_name text not null default ''
);

create table players (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  dob date not null,
  phone text not null default '',
  team_id uuid references teams(id) on delete set null,
  no int,
  pos text not null default '',
  joined date not null default current_date,
  source text not null default '',
  medical boolean not null default false,
  medical_note text not null default '',
  photo_consent boolean not null default true,
  status text not null default 'active',
  profile_id uuid,
  created_at timestamptz not null default now(),
  photo_path text,
  socials jsonb not null default '{}'::jsonb
);
create index players_team_idx on players (team_id);
create index players_family_idx on players (family_id);

create table fixtures (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  date date not null,
  time text not null,
  venue_id uuid references venues(id) on delete set null,
  court int not null default 1,
  opp text not null default 'To be drawn',
  round int,
  us int,
  them int,
  video_url text
);
create index fixtures_team_date_idx on fixtures (team_id, date);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role app_role not null default 'pending',
  full_name text not null default '',
  coach_id uuid references coaches(id) on delete set null,
  guardian_id uuid references guardians(id) on delete set null,
  player_id uuid references players(id) on delete set null,
  created_at timestamptz not null default now()
);

create table availability (
  session_key text not null,
  player_id uuid not null references players(id) on delete cascade,
  status text not null check (status in ('in','out')),
  set_by uuid,
  updated_at timestamptz not null default now(),
  primary key (session_key, player_id)
);

create table roll (
  session_key text not null,
  player_id uuid not null references players(id) on delete cascade,
  present boolean not null,
  taken_by uuid,
  taken_at timestamptz not null default now(),
  primary key (session_key, player_id)
);

create table game_stats (
  fixture_id uuid not null references fixtures(id) on delete cascade,
  player_id uuid not null references players(id) on delete cascade,
  points int not null default 0,
  note text not null default '',
  entered_by uuid,
  primary key (fixture_id, player_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  amount numeric not null,
  paid_on date not null default current_date,
  method text not null default 'Bank transfer',
  recorded_by uuid,
  created_at timestamptz not null default now(),
  receipt_no bigint not null generated by default as identity,
  note text not null default ''
);

create table instalments (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  due date not null,
  amount numeric not null,
  note text not null default ''
);

create table player_notes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  body text not null,
  by_name text not null default '',
  created_at timestamptz not null default now()
);

create table player_log (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  on_date date not null default current_date,
  body text not null
);

create table registrations (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  stage text not null default 'new',
  first_name text not null,
  last_name text not null,
  phone text not null default '',
  dob date,
  gname text not null default '',
  gphone text not null default '',
  gemail text not null default '',
  msg text not null default '',
  tryout jsonb,
  log jsonb not null default '[]'::jsonb,
  player_id uuid references players(id) on delete set null,
  archived boolean not null default false
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  body text not null,
  who text not null default '',
  due date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  kind conv_kind not null,
  family_id uuid references families(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_preview text not null default ''
);
create unique index conversations_family_key on conversations (kind, family_id) where (kind in ('family','club'));
create unique index conversations_coach_key on conversations (kind, family_id, team_id) where (kind = 'coach');

create table conversation_reads (
  conversation_id uuid not null references conversations(id) on delete cascade,
  profile_id uuid not null,
  last_read_at timestamptz not null default now(),
  primary key (conversation_id, profile_id)
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null,
  sender_name text not null default '',
  sender_role app_role not null default 'pending',
  body text not null check (length(body) >= 1 and length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index messages_conv_idx on messages (conversation_id, created_at);

create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null,
  author_name text not null default '',
  author_role app_role not null default 'pending',
  body text not null check (length(body) >= 1 and length(body) <= 4000),
  status mod_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null,
  author_name text not null default '',
  author_role app_role not null default 'pending',
  body text not null check (length(body) >= 1 and length(body) <= 2000),
  status mod_status not null default 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  profile_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (post_id, profile_id)
);

create table media (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  kind text not null check (kind in ('image','video')),
  caption text not null default '',
  author_id uuid,
  author_name text not null default '',
  status mod_status not null default 'pending',
  created_at timestamptz not null default now()
);

create table notices (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  title text not null,
  body text not null default '',
  by_name text not null default '',
  created_at timestamptz not null default now()
);

create table season_archive (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date,
  end_date date,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create table activation_codes (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('guardian','coach','admin')),
  target_id uuid,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table player_codes (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table invites (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('coach','family')),
  label text not null default '',
  token_hash text not null,
  expires_at timestamptz not null default (now() + interval '14 days'),
  used_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);

create table setup_links (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  kind text not null check (kind in ('admin','coach','guardian')),
  target_id uuid,
  token_hash text not null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table auth_attempts (
  id bigint primary key generated by default as identity,
  ip text not null,
  kind text not null,
  at timestamptz not null default now()
);
create index auth_attempts_ip_idx on auth_attempts (ip, kind, at);

-- ---------- helper functions (used by RLS) ----------
create or replace function is_admin() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_staff() returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'coach'));
$$;

create or replace function my_role() returns app_role
language sql stable security definer set search_path to 'public' as $$
  select coalesce((select role from profiles where id = auth.uid()), 'pending'::app_role);
$$;

create or replace function my_coach_id() returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coach_id from profiles where id = auth.uid();
$$;

create or replace function my_player_id() returns uuid
language sql stable security definer set search_path to 'public' as $$
  select player_id from profiles where id = auth.uid();
$$;

create or replace function my_family_id() returns uuid
language sql stable security definer set search_path to 'public' as $$
  select coalesce(
    (select g.family_id from profiles p join guardians g on g.id = p.guardian_id where p.id = auth.uid()),
    (select pl.family_id from profiles p join players pl on pl.id = p.player_id where p.id = auth.uid()));
$$;

create or replace function coach_team_ids() returns setof uuid
language sql stable security definer set search_path to 'public' as $$
  select t.id from teams t, profiles p
  where p.id = auth.uid() and p.coach_id is not null
    and (t.coach_id = p.coach_id or t.asst_id = p.coach_id);
$$;

create or replace function family_team_ids() returns setof uuid
language sql stable security definer set search_path to 'public' as $$
  select distinct team_id from players where family_id = my_family_id() and team_id is not null and status = 'active';
$$;

create or replace function player_in_my_family(pid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from players where id = pid and family_id = my_family_id());
$$;

create or replace function coach_can_see_player(pid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from players where id = pid and team_id in (select coach_team_ids()));
$$;

create or replace function coach_can_see_family(fid uuid) returns boolean
language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from players where family_id = fid and team_id in (select coach_team_ids()));
$$;

create or replace function can_see_conversation(c conversations) returns boolean
language plpgsql stable security definer set search_path to 'public' as $$
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

create or replace function session_team(key text) returns uuid
language sql immutable set search_path to 'public' as $$
  select nullif(split_part(key, '|', 1), '')::uuid;
$$;

-- ---------- codes, invites, rate limiting ----------
create or replace function gen_code(n integer) returns text
language sql set search_path to 'public', 'extensions' as $$
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
  from generate_series(1, n);
$$;

create or replace function create_activation_code(p_kind text, p_target uuid, p_email text) returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
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

create or replace function create_player_code(p_player uuid) returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
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

create or replace function create_invite(p_kind text, p_label text default ''::text) returns text
language plpgsql security definer set search_path to 'public', 'extensions' as $$
declare tok text;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_kind not in ('coach','family') then raise exception 'bad kind'; end if;
  tok := translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into invites (kind, label, token_hash, created_by)
  values (p_kind, coalesce(p_label, ''), crypt(tok, gen_salt('bf')), auth.uid());
  return tok;
end $$;

create or replace function match_activation(p_email text, p_code text) returns activation_codes
language sql stable security definer set search_path to 'public', 'extensions' as $$
  select * from activation_codes
  where lower(email) = lower(trim(p_email)) and used_at is null and expires_at > now()
    and code_hash = crypt(upper(trim(p_code)), code_hash)
  limit 1;
$$;

create or replace function match_player_code(p_code text) returns player_codes
language sql stable security definer set search_path to 'public', 'extensions' as $$
  select * from player_codes
  where used_at is null and expires_at > now() and code_hash = crypt(trim(p_code), code_hash)
  limit 1;
$$;

create or replace function match_invite(p_token text) returns invites
language sql stable security definer set search_path to 'public', 'extensions' as $$
  select * from invites
  where used_at is null and expires_at > now()
    and token_hash = crypt(trim(p_token), token_hash)
  limit 1;
$$;

create or replace function match_setup_token(p_token text) returns setup_links
language sql stable security definer set search_path to 'public', 'extensions' as $$
  select * from setup_links
  where used_at is null and expires_at > now()
    and token_hash = crypt(trim(p_token), token_hash)
  limit 1;
$$;

create or replace function recent_failures(p_ip text, p_kind text) returns integer
language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from auth_attempts where ip = p_ip and kind = p_kind and at > now() - interval '15 minutes';
$$;

create or replace function user_id_by_email(p_email text) returns uuid
language sql stable security definer set search_path to 'public', 'auth' as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1;
$$;

-- ---------- app RPCs ----------
create or replace function open_conversation(p_kind conv_kind, p_family uuid, p_team uuid) returns uuid
language plpgsql security definer set search_path to 'public' as $$
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

create or replace function set_player_profile(p_player uuid, p_photo text, p_socials jsonb, p_phone text) returns void
language plpgsql security definer set search_path to 'public' as $$
begin
  if not (is_admin() or player_in_my_family(p_player)) then raise exception 'not your player'; end if;
  update players set
    photo_path = coalesce(p_photo, photo_path),
    socials = coalesce(p_socials, socials),
    phone = coalesce(p_phone, phone)
  where id = p_player;
end $$;

-- ---------- triggers ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path to 'public' as $$
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

create or replace function stamp_message() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.sender_id := auth.uid();
  new.sender_name := coalesce(p.full_name, '');
  new.sender_role := coalesce(p.role, 'pending');
  update conversations set last_message_at = now(), last_preview = left(new.body, 120) where id = new.conversation_id;
  return new;
end $$;

create trigger messages_stamp before insert on messages
  for each row execute function stamp_message();

create or replace function stamp_post() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(p.full_name, '');
  new.author_role := coalesce(p.role, 'pending');
  if p.role = 'admin' then
    new.status := 'approved'; new.reviewed_by := auth.uid(); new.reviewed_at := now();
  else
    new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null;
  end if;
  return new;
end $$;

create trigger posts_stamp before insert on posts
  for each row execute function stamp_post();
create trigger comments_stamp before insert on comments
  for each row execute function stamp_post();

create or replace function stamp_media() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(p.full_name, '');
  if p.role in ('admin', 'coach') then new.status := 'approved'; else new.status := 'pending'; end if;
  return new;
end $$;

create trigger media_stamp before insert on media
  for each row execute function stamp_media();

create or replace function sync_team_coach_names() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  new.coach_name := coalesce((select name from coaches where id = new.coach_id), '');
  new.asst_name  := coalesce((select name from coaches where id = new.asst_id), '');
  return new;
end $$;

create trigger teams_coach_names before insert or update on teams
  for each row execute function sync_team_coach_names();

create or replace function refresh_team_coach_names() returns trigger
language plpgsql security definer set search_path to 'public' as $$
begin
  update teams set coach_name = new.name where coach_id = new.id;
  update teams set asst_name = new.name where asst_id = new.id;
  return new;
end $$;

create trigger coaches_rename after update of name on coaches
  for each row execute function refresh_team_coach_names();

-- ---------- row-level security ----------
alter table org_settings enable row level security;
alter table venues enable row level security;
alter table families enable row level security;
alter table guardians enable row level security;
alter table coaches enable row level security;
alter table teams enable row level security;
alter table players enable row level security;
alter table fixtures enable row level security;
alter table profiles enable row level security;
alter table availability enable row level security;
alter table roll enable row level security;
alter table game_stats enable row level security;
alter table payments enable row level security;
alter table instalments enable row level security;
alter table player_notes enable row level security;
alter table player_log enable row level security;
alter table registrations enable row level security;
alter table tasks enable row level security;
alter table conversations enable row level security;
alter table conversation_reads enable row level security;
alter table messages enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table post_likes enable row level security;
alter table media enable row level security;
alter table notices enable row level security;
alter table season_archive enable row level security;
alter table activation_codes enable row level security;
alter table player_codes enable row level security;
alter table invites enable row level security;
alter table setup_links enable row level security;
alter table auth_attempts enable row level security;

create policy org_read on org_settings for select to authenticated using (my_role() <> 'pending'::app_role);
create policy org_admin on org_settings for update to authenticated using (is_admin()) with check (is_admin());

create policy venues_read on venues for select to authenticated using (my_role() <> 'pending'::app_role);
create policy venues_admin on venues for all to authenticated using (is_admin()) with check (is_admin());

create policy families_read on families for select to authenticated
  using (is_admin() or (id = my_family_id()) or ((my_role() = 'coach'::app_role) and coach_can_see_family(id)));
create policy families_admin on families for all to authenticated using (is_admin()) with check (is_admin());

create policy guardians_read on guardians for select to authenticated
  using (is_admin() or (family_id = my_family_id()) or ((my_role() = 'coach'::app_role) and coach_can_see_family(family_id)));
create policy guardians_self on guardians for update to authenticated
  using (profile_id = auth.uid()) with check ((profile_id = auth.uid()) and (family_id = my_family_id()));
create policy guardians_admin on guardians for all to authenticated using (is_admin()) with check (is_admin());

create policy coaches_staff on coaches for select to authenticated using (is_staff());
create policy coaches_self on coaches for update to authenticated
  using (id = my_coach_id()) with check (id = my_coach_id());
create policy coaches_admin on coaches for all to authenticated using (is_admin()) with check (is_admin());

create policy teams_read on teams for select to authenticated using (my_role() <> 'pending'::app_role);
create policy teams_admin on teams for all to authenticated using (is_admin()) with check (is_admin());

create policy players_read on players for select to authenticated
  using (is_admin() or (family_id = my_family_id()) or ((my_role() = 'coach'::app_role) and coach_can_see_player(id)));
create policy players_admin on players for all to authenticated using (is_admin()) with check (is_admin());

create policy fixtures_read on fixtures for select to authenticated using (my_role() <> 'pending'::app_role);
create policy fixtures_coach_score on fixtures for update to authenticated
  using (team_id in (select coach_team_ids())) with check (team_id in (select coach_team_ids()));
create policy fixtures_admin on fixtures for all to authenticated using (is_admin()) with check (is_admin());

create policy profiles_read on profiles for select to authenticated
  using ((id = auth.uid()) or is_admin() or (role = any (array['admin'::app_role, 'coach'::app_role])));
create policy profiles_self on profiles for update to authenticated
  using (id = auth.uid()) with check ((id = auth.uid()) and (role = my_role()));

create policy availability_read on availability for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));
create policy availability_write on availability for all to authenticated
  using (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)))
  with check (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));

create policy roll_read on roll for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));
create policy roll_write on roll for all to authenticated
  using (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)))
  with check (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));

create policy stats_read on game_stats for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));
create policy stats_write on game_stats for all to authenticated
  using (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)))
  with check (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));

create policy payments_read on payments for select to authenticated
  using (is_admin() or ((my_role() = 'parent'::app_role) and player_in_my_family(player_id)));
create policy payments_admin on payments for all to authenticated using (is_admin()) with check (is_admin());

create policy inst_read on instalments for select to authenticated
  using (is_admin() or ((my_role() = 'parent'::app_role) and player_in_my_family(player_id)));
create policy inst_admin on instalments for all to authenticated using (is_admin()) with check (is_admin());

create policy notes_staff on player_notes for all to authenticated
  using (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)))
  with check (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));

create policy log_read on player_log for select to authenticated
  using (is_admin() or player_in_my_family(player_id) or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));
create policy log_staff on player_log for insert to authenticated
  with check (is_admin() or ((my_role() = 'coach'::app_role) and coach_can_see_player(player_id)));

create policy regs_admin on registrations for all to authenticated using (is_admin()) with check (is_admin());

create policy tasks_staff on tasks for all to authenticated using (is_staff()) with check (is_staff());

create policy conv_read on conversations for select to authenticated using (can_see_conversation(conversations.*));

create policy reads_own on conversation_reads for all to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

create policy msg_read on messages for select to authenticated
  using (exists (select 1 from conversations c where c.id = messages.conversation_id and can_see_conversation(c.*)));
create policy msg_write on messages for insert to authenticated
  with check ((my_role() <> 'pending'::app_role) and (exists (select 1 from conversations c where c.id = messages.conversation_id and can_see_conversation(c.*))));
create policy msg_admin_delete on messages for delete to authenticated using (is_admin());

create policy posts_read on posts for select to authenticated
  using ((my_role() <> 'pending'::app_role) and ((status = 'approved'::mod_status) or (author_id = auth.uid()) or is_admin()));
create policy posts_write on posts for insert to authenticated with check (my_role() <> 'pending'::app_role);
create policy posts_admin on posts for update to authenticated using (is_admin()) with check (is_admin());
create policy posts_delete on posts for delete to authenticated
  using (is_admin() or ((author_id = auth.uid()) and (status = 'pending'::mod_status)));

create policy comments_read on comments for select to authenticated
  using ((my_role() <> 'pending'::app_role) and (is_admin() or (author_id = auth.uid()) or ((status = 'approved'::mod_status) and (exists (select 1 from posts p where p.id = comments.post_id and p.status = 'approved'::mod_status)))));
create policy comments_write on comments for insert to authenticated
  with check ((my_role() <> 'pending'::app_role) and (exists (select 1 from posts p where p.id = comments.post_id and p.status = 'approved'::mod_status)));
create policy comments_admin on comments for update to authenticated using (is_admin()) with check (is_admin());
create policy comments_delete on comments for delete to authenticated
  using (is_admin() or ((author_id = auth.uid()) and (status = 'pending'::mod_status)));

create policy likes_read on post_likes for select to authenticated using (my_role() <> 'pending'::app_role);
create policy likes_own on post_likes for all to authenticated
  using (profile_id = auth.uid()) with check ((profile_id = auth.uid()) and (my_role() <> 'pending'::app_role));

create policy media_read on media for select to authenticated
  using ((my_role() <> 'pending'::app_role) and ((status = 'approved'::mod_status) or (author_id = auth.uid()) or is_admin()));
create policy media_insert on media for insert to authenticated with check (my_role() <> 'pending'::app_role);
create policy media_admin on media for update to authenticated using (is_admin()) with check (is_admin());
create policy media_delete on media for delete to authenticated using (is_admin() or (author_id = auth.uid()));

create policy notices_read on notices for select to authenticated
  using (is_staff() or (team_id is null) or (team_id in (select family_team_ids())));
create policy notices_coach on notices for insert to authenticated
  with check (team_id in (select coach_team_ids()));
create policy notices_admin on notices for all to authenticated using (is_admin()) with check (is_admin());

create policy season_archive_staff on season_archive for select to authenticated using (is_staff());
create policy season_archive_admin on season_archive for all to authenticated using (is_admin()) with check (is_admin());

create policy codes_admin on activation_codes for select to authenticated using (is_admin());

create policy pcodes_read on player_codes for select to authenticated
  using (is_admin() or ((my_role() = 'parent'::app_role) and player_in_my_family(player_id)));

create policy invites_admin_read on invites for select using (is_admin());

-- setup_links and auth_attempts: no policies — service role (edge functions) only.

-- ---------- storage ----------
insert into storage.buckets (id, name, public) values
  ('avatars', 'avatars', false),
  ('media', 'media', false)
on conflict (id) do nothing;

create policy avatars_read on storage.objects for select to authenticated
  using ((bucket_id = 'avatars'::text) and (my_role() <> 'pending'::app_role));
create policy avatars_write on storage.objects for insert to authenticated
  with check ((bucket_id = 'avatars'::text) and (is_staff() or player_in_my_family((nullif(split_part(split_part(name, '/'::text, 2), '.'::text, 1), ''::text))::uuid)));
create policy avatars_update on storage.objects for update to authenticated
  using ((bucket_id = 'avatars'::text) and (is_staff() or player_in_my_family((nullif(split_part(split_part(name, '/'::text, 2), '.'::text, 1), ''::text))::uuid)));
create policy avatars_delete on storage.objects for delete to authenticated
  using ((bucket_id = 'avatars'::text) and is_admin());

create policy media_files_read on storage.objects for select to authenticated
  using ((bucket_id = 'media'::text) and (my_role() <> 'pending'::app_role));
create policy media_files_write on storage.objects for insert to authenticated
  with check ((bucket_id = 'media'::text) and (my_role() <> 'pending'::app_role));
create policy media_files_delete on storage.objects for delete to authenticated
  using ((bucket_id = 'media'::text) and is_admin());

-- ---------- seed ----------
insert into org_settings (id, name, contact_name, email, phone, base, season, min_roster, min_game, prayer)
values (1, '{{CLUB_NAME}}', '{{CONTACT_NAME}}', '{{CLUB_EMAIL}}', '{{CLUB_PHONE}}', '{{CLUB_BASE}}',
        jsonb_build_object('ageYear', extract(year from now())::int),
        {{MIN_ROSTER}}, {{MIN_GAME}}, {{PRAYER_DEFAULT}})
on conflict (id) do nothing;
