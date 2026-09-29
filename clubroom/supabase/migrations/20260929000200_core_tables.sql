-- Core tables. Naming: snake_case, plural tables, `club_id` on every club-owned row.

-- ---------------------------------------------------------------------------
-- Reference data: sports and their default vocabulary
-- ---------------------------------------------------------------------------
create table public.sports (
  key              text primary key,
  name             text not null,
  vocabulary       jsonb not null default '{}'::jsonb,   -- {"event": "game", "events": "games", "training": "training", "division": "division"}
  default_divisions jsonb not null default '[]'::jsonb,  -- [{"name":"U12","max_age":11}, ...]
  default_skills   jsonb not null default '[]'::jsonb,   -- [{"key":"ball","name":"Ball handling","unlock_at":5}, ...]
  default_levels   jsonb not null default '[]'::jsonb,   -- [{"key":"rookie","name":"Rookie","at":0,...}, ...]
  default_badges   jsonb not null default '[]'::jsonb,
  sort             int not null default 100
);

-- ---------------------------------------------------------------------------
-- Clubs and membership
-- ---------------------------------------------------------------------------
create table public.clubs (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])?$'),
  name             text not null check (char_length(name) between 2 and 80),
  short_name       text,
  sport_key        text not null references public.sports(key),
  logo_path        text,
  colours          jsonb not null default '{"primary":"#F2B705","accent":"#F2B705","on_primary":"#14120A"}'::jsonb,
  theme_default    public.theme_pref not null default 'dark',
  timezone         text not null default 'Australia/Sydney',
  is_demo          boolean not null default false,
  status           public.club_status not null default 'onboarding',
  onboarding_step  int not null default 0,
  settings         jsonb not null default '{}'::jsonb,   -- vocabulary overrides, feature flags
  public_page      jsonb not null default '{}'::jsonb,   -- headline, blurb, cta, socials, hero image
  contact_email    extensions.citext,
  contact_phone    text,
  instagram_handle text,
  website          text,
  suburb           text,
  state            text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger clubs_updated_at before update on public.clubs
  for each row execute function app.set_updated_at();

create table public.platform_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  theme        public.theme_pref not null default 'dark',
  last_club_id uuid references public.clubs(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function app.set_updated_at();

create table public.club_users (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        public.club_role not null,
  status      public.membership_status not null default 'active',
  invited_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now(),
  unique (club_id, user_id, role)
);
create index club_users_user_idx on public.club_users (user_id, club_id) where status = 'active';

create table public.invites (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  email       extensions.citext not null,
  role        public.club_role not null,
  person_id   uuid,                                  -- set once people exists (fk added below)
  token_hash  text not null unique,
  invited_by  uuid references auth.users(id) on delete set null,
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index invites_club_idx on public.invites (club_id);

-- ---------------------------------------------------------------------------
-- Seasons, divisions, venues, teams
-- ---------------------------------------------------------------------------
create table public.venues (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  name       text not null,
  address    text,
  map_url    text,
  created_at timestamptz not null default now()
);
create index venues_club_idx on public.venues (club_id);

create table public.seasons (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references public.clubs(id) on delete cascade,
  name              text not null,
  starts_on         date,
  ends_on           date,
  age_rule_mode     public.age_rule_mode not null default 'age_at_date',
  age_cutoff_date   date,                              -- required when mode = age_at_date
  fee_cents         int check (fee_cents is null or fee_cents >= 0),
  fee_label         text,                              -- e.g. "per player, per season"
  registration_open boolean not null default true,
  is_current        boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (age_rule_mode <> 'age_at_date' or age_cutoff_date is not null)
);
create unique index seasons_one_current_per_club on public.seasons (club_id) where is_current;
create index seasons_club_idx on public.seasons (club_id);
create trigger seasons_updated_at before update on public.seasons
  for each row execute function app.set_updated_at();

-- Divisions are the age groups of a season. With mode birth_year the bounds are
-- born_from/born_to; with age_at_date they are min_age/max_age at the cutoff date.
create table public.divisions (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  season_id  uuid not null references public.seasons(id) on delete cascade,
  name       text not null,
  sort       int not null default 0,
  gender     text,                                     -- null = mixed
  born_from  int,
  born_to    int,
  min_age    int,
  max_age    int,
  created_at timestamptz not null default now(),
  unique (season_id, name)
);
create index divisions_season_idx on public.divisions (season_id, sort);

create table public.teams (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  season_id   uuid not null references public.seasons(id) on delete cascade,
  division_id uuid references public.divisions(id) on delete set null,
  name        text not null,
  colour      text,
  venue_id    uuid references public.venues(id) on delete set null,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index teams_club_idx on public.teams (club_id, season_id);

-- ---------------------------------------------------------------------------
-- People: players, guardians, staff
-- ---------------------------------------------------------------------------
create table public.people (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubs(id) on delete cascade,
  kind             public.person_kind not null,
  first_name       text not null,
  last_name        text not null default '',
  dob              date,
  gender           text,
  school           text,
  email            extensions.citext,
  mobile           text,
  user_id          uuid references auth.users(id) on delete set null,   -- linked login, if any
  has_medical_flag boolean not null default false,     -- maintained by trigger; content lives in person_sensitive
  photo_consent    boolean,                            -- latest known consent, maintained by registration flow
  archived_at      timestamptz,
  archived_by      uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index people_club_idx on public.people (club_id, kind) where archived_at is null;
create index people_name_idx on public.people (club_id, lower(last_name), lower(first_name));
create index people_user_idx on public.people (user_id) where user_id is not null;
create index people_dup_idx on public.people (club_id, lower(first_name), lower(last_name), dob);
create trigger people_updated_at before update on public.people
  for each row execute function app.set_updated_at();

alter table public.invites
  add constraint invites_person_fk foreign key (person_id) references public.people(id) on delete set null;

create table public.guardianships (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references public.clubs(id) on delete cascade,
  guardian_person_id uuid not null references public.people(id) on delete cascade,
  child_person_id    uuid not null references public.people(id) on delete cascade,
  relationship       text,
  is_primary         boolean not null default true,
  created_at         timestamptz not null default now(),
  unique (guardian_person_id, child_person_id),
  check (guardian_person_id <> child_person_id)
);
create index guardianships_child_idx on public.guardianships (child_person_id);
create index guardianships_guardian_idx on public.guardianships (guardian_person_id);

-- Sensitive details are kept apart so they can carry a tighter policy and an
-- audited read path. There is deliberately no SELECT policy on this table.
create table public.person_sensitive (
  person_id              uuid primary key references public.people(id) on delete cascade,
  club_id                uuid not null references public.clubs(id) on delete cascade,
  medical                text,
  ambulance_cover        text,
  emergency_name         text,
  emergency_phone        text,
  emergency_relationship text,
  updated_by             uuid references auth.users(id) on delete set null,
  updated_at             timestamptz not null default now()
);
create index person_sensitive_club_idx on public.person_sensitive (club_id);

-- ---------------------------------------------------------------------------
-- Registration forms, registrations, consents
-- ---------------------------------------------------------------------------
create table public.form_templates (
  id                uuid primary key default gen_random_uuid(),
  club_id           uuid not null references public.clubs(id) on delete cascade,
  name              text not null default 'Registration',
  version           int not null default 1,
  intro             text,
  collection_notice text,
  fields            jsonb not null default '[]'::jsonb,   -- ordered field definitions
  consents          jsonb not null default '[]'::jsonb,   -- [{key,label,text,required}]
  is_active         boolean not null default true,
  published_at      timestamptz,
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  unique (club_id, version)
);
create unique index form_templates_one_active on public.form_templates (club_id) where is_active;

create table public.registrations (
  id                 uuid primary key default gen_random_uuid(),
  club_id            uuid not null references public.clubs(id) on delete cascade,
  season_id          uuid references public.seasons(id) on delete set null,
  form_template_id   uuid references public.form_templates(id) on delete set null,
  form_version       int,
  player_person_id   uuid not null references public.people(id) on delete cascade,
  guardian_person_id uuid references public.people(id) on delete set null,
  uniform_size       text,
  experience         text,
  heard_via          text,
  notes              text,
  custom             jsonb not null default '{}'::jsonb,
  source             public.registration_source not null default 'public_form',
  status             public.registration_status not null default 'new',
  possible_duplicate boolean not null default false,
  submitted_at       timestamptz not null default now(),
  ip_hash            text,
  user_agent         text,
  reviewed_by        uuid references auth.users(id) on delete set null,
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index registrations_club_idx on public.registrations (club_id, submitted_at desc);
create index registrations_player_idx on public.registrations (player_person_id);
create index registrations_season_idx on public.registrations (season_id);
create trigger registrations_updated_at before update on public.registrations
  for each row execute function app.set_updated_at();

create table public.consents (
  id                   uuid primary key default gen_random_uuid(),
  club_id              uuid not null references public.clubs(id) on delete cascade,
  registration_id      uuid references public.registrations(id) on delete cascade,
  person_id            uuid not null references public.people(id) on delete cascade,
  consent_key          text not null,
  granted              boolean not null,
  text_shown           text not null,
  form_version         int,
  granted_at           timestamptz not null default now(),
  granted_by_person_id uuid references public.people(id) on delete set null,
  created_at           timestamptz not null default now()
);
create index consents_person_idx on public.consents (person_id, consent_key, granted_at desc);
create index consents_club_idx on public.consents (club_id);

-- ---------------------------------------------------------------------------
-- Teams, events, availability, attendance, progression
-- ---------------------------------------------------------------------------
create table public.team_members (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs(id) on delete cascade,
  team_id       uuid not null references public.teams(id) on delete cascade,
  person_id     uuid not null references public.people(id) on delete cascade,
  role          text not null check (role in ('player', 'coach', 'manager')),
  jersey_number text,
  created_at    timestamptz not null default now(),
  unique (team_id, person_id, role)
);
create index team_members_person_idx on public.team_members (person_id);
create index team_members_team_idx on public.team_members (team_id, role);

create table public.events (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  season_id  uuid references public.seasons(id) on delete cascade,
  team_id    uuid references public.teams(id) on delete cascade,    -- null = club-wide
  kind       public.event_kind not null default 'training',
  title      text,
  starts_at  timestamptz not null,
  ends_at    timestamptz,
  venue_id   uuid references public.venues(id) on delete set null,
  opponent   text,
  result     jsonb,
  notes      text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index events_club_idx on public.events (club_id, starts_at);
create index events_team_idx on public.events (team_id, starts_at);

create table public.availability (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  status     public.availability_status not null default 'unknown',
  set_by     uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique (event_id, person_id)
);

create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  event_id   uuid not null references public.events(id) on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  present    boolean not null,
  marked_by  uuid references auth.users(id) on delete set null,
  marked_at  timestamptz not null default now(),
  unique (event_id, person_id)
);
create index attendance_person_idx on public.attendance (person_id) where present;

create table public.skill_ratings (
  id         uuid primary key default gen_random_uuid(),
  club_id    uuid not null references public.clubs(id) on delete cascade,
  person_id  uuid not null references public.people(id) on delete cascade,
  skill_key  text not null,
  rating     smallint not null check (rating between 1 and 5),
  rated_by   uuid references auth.users(id) on delete set null,
  rated_at   timestamptz not null default now()
);
create index skill_ratings_person_idx on public.skill_ratings (person_id, skill_key, rated_at desc);

create table public.coach_notes (
  id             uuid primary key default gen_random_uuid(),
  club_id        uuid not null references public.clubs(id) on delete cascade,
  person_id      uuid not null references public.people(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index coach_notes_person_idx on public.coach_notes (person_id, created_at desc);

create table public.level_config (
  club_id    uuid primary key references public.clubs(id) on delete cascade,
  levels     jsonb not null default '[]'::jsonb,
  skills     jsonb not null default '[]'::jsonb,
  badges     jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Money (tracked, not collected, in Phase 1)
-- ---------------------------------------------------------------------------
create table public.fees (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  season_id    uuid references public.seasons(id) on delete cascade,
  person_id    uuid not null references public.people(id) on delete cascade,
  amount_cents int not null check (amount_cents >= 0),
  status       public.fee_status not null default 'owing',
  due_on       date,
  note         text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index fees_club_idx on public.fees (club_id, season_id, status);
create index fees_person_idx on public.fees (person_id);
create trigger fees_updated_at before update on public.fees
  for each row execute function app.set_updated_at();

create table public.payments (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  fee_id       uuid not null references public.fees(id) on delete cascade,
  amount_cents int not null check (amount_cents > 0),
  method       public.payment_method not null default 'other',
  reference    text,
  paid_on      date not null default current_date,
  recorded_by  uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index payments_fee_idx on public.payments (fee_id);

-- ---------------------------------------------------------------------------
-- Operations: tasks, notices, submissions, clearances
-- ---------------------------------------------------------------------------
create table public.tasks (
  id               uuid primary key default gen_random_uuid(),
  club_id          uuid not null references public.clubs(id) on delete cascade,
  title            text not null,
  owner_user_id    uuid references auth.users(id) on delete set null,
  due_on           date,
  status           public.task_status not null default 'open',
  linked_person_id uuid references public.people(id) on delete set null,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  done_at          timestamptz
);
create index tasks_club_idx on public.tasks (club_id, status, due_on);

create table public.notices (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  title        text not null,
  body         text not null,
  audience     jsonb not null default '{"all": true}'::jsonb,   -- {"all":true} | {"teams":[...]} | {"roles":[...]}
  published_at timestamptz,
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now()
);
create index notices_club_idx on public.notices (club_id, published_at desc);

create table public.submissions (
  id            uuid primary key default gen_random_uuid(),
  club_id       uuid not null references public.clubs(id) on delete cascade,
  kind          public.submission_kind not null,
  person_id     uuid references public.people(id) on delete set null,     -- the child it concerns
  submitted_by  uuid references auth.users(id) on delete set null,
  body          jsonb not null default '{}'::jsonb,
  status        public.submission_status not null default 'new',
  handled_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index submissions_club_idx on public.submissions (club_id, status, created_at desc);
create trigger submissions_updated_at before update on public.submissions
  for each row execute function app.set_updated_at();

-- WWCC: we keep only the expiry, verification and last four characters. Never the full number.
create table public.coach_clearances (
  id           uuid primary key default gen_random_uuid(),
  club_id      uuid not null references public.clubs(id) on delete cascade,
  person_id    uuid not null references public.people(id) on delete cascade,
  kind         public.clearance_kind not null default 'wwcc',
  number_last4 text check (number_last4 is null or char_length(number_last4) <= 4),
  expires_on   date,
  verified_by  uuid references auth.users(id) on delete set null,
  verified_at  timestamptz,
  note         text,
  created_at   timestamptz not null default now(),
  unique (person_id, kind)
);
create index coach_clearances_club_idx on public.coach_clearances (club_id, expires_on);

-- ---------------------------------------------------------------------------
-- Imports, billing, audit, rate limits
-- ---------------------------------------------------------------------------
create table public.imports (
  id          uuid primary key default gen_random_uuid(),
  club_id     uuid not null references public.clubs(id) on delete cascade,
  file_name   text,
  row_count   int,
  mapping     jsonb not null default '{}'::jsonb,
  result      jsonb not null default '{}'::jsonb,
  imported_by uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index imports_club_idx on public.imports (club_id, created_at desc);

create table public.subscriptions (
  club_id                uuid primary key references public.clubs(id) on delete cascade,
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  plan                   public.plan_key not null default 'club',
  status                 public.subscription_status not null default 'trialing',
  trial_ends_at          timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  member_limit           int not null default 400,
  updated_at             timestamptz not null default now()
);

-- Append-only. Nobody updates or deletes audit rows through the API.
create table public.audit_log (
  id              bigint generated always as identity primary key,
  club_id         uuid references public.clubs(id) on delete cascade,
  actor_user_id   uuid,
  impersonated_by uuid,
  action          text not null,
  target_table    text,
  target_id       text,
  detail          jsonb not null default '{}'::jsonb,
  ip_hash         text,
  at              timestamptz not null default now()
);
create index audit_log_club_idx on public.audit_log (club_id, at desc);
create index audit_log_actor_idx on public.audit_log (actor_user_id, at desc);

create table public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  count        int not null default 0
);
