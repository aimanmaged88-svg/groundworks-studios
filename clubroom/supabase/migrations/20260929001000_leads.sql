-- Prospects who build a preview and ask to be contacted. Platform-owned, not club-owned.
create table public.leads (
  id            uuid primary key default gen_random_uuid(),
  club_name     text not null,
  sport_key     text,
  suburb        text,
  instagram     text,
  contact_name  text,
  email         extensions.citext,
  mobile        text,
  colours       jsonb not null default '{}'::jsonb,
  logo_url      text,
  message       text,
  source        text not null default 'preview',
  ip_hash       text,
  created_at    timestamptz not null default now()
);
alter table public.leads enable row level security;
-- written by the server (service role); read by platform owners only
create policy leads_owner_read on public.leads for select to authenticated using (app.is_platform_owner());
