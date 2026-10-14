-- From Cam & Aiman's HQ notes:
--   payments.kind        — split season fees from kit/apparel money
--   apparel              — per-player kit orders (jersey/shorts/socks/…), paid + received flags
--   guardians.arrangements — pickup / custody / special arrangements, shown on the parent card
--   guardian_notes       — admin-only notes on parents
--   coaches.profile      — jsonb profile (specialty, years, kids, loves, bio) for coach cards
alter table payments add column if not exists kind text not null default 'fees';
alter table guardians add column if not exists arrangements text not null default '';
alter table coaches add column if not exists profile jsonb not null default '{}'::jsonb;

create table if not exists apparel (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  item text not null,
  size text not null default '',
  price numeric not null default 0,
  paid boolean not null default false,
  received boolean not null default false,
  note text not null default '',
  created_at timestamptz not null default now()
);
alter table apparel enable row level security;
create policy apparel_staff on apparel for all to authenticated
  using (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)))
  with check (is_admin() or (my_role() = 'coach' and coach_can_see_player(player_id)));
create policy apparel_parent_read on apparel for select to authenticated
  using (my_role() = 'parent' and player_in_my_family(player_id));

create table if not exists guardian_notes (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references guardians(id) on delete cascade,
  body text not null,
  by_name text not null default '',
  created_at timestamptz not null default now()
);
alter table guardian_notes enable row level security;
create policy gnotes_admin on guardian_notes for all to authenticated
  using (is_admin()) with check (is_admin());
