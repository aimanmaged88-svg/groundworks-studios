-- One-tap welcome links. Instead of typing email + code, a staff member or
-- parent gets a personal URL carrying a long random token. Opening it asks
-- for a password only; the setup edge function verifies the token, sets the
-- password on their account and the app signs them in straight away.
create table setup_links (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  kind       text not null check (kind in ('admin','coach','guardian')),
  target_id  uuid,
  token_hash text not null,
  expires_at timestamptz not null default now() + interval '7 days',
  used_at    timestamptz,
  created_at timestamptz not null default now()
);
alter table setup_links enable row level security;

create or replace function match_setup_token(p_token text) returns setup_links
language sql stable security definer set search_path = public, extensions as $$
  select * from setup_links
  where used_at is null and expires_at > now()
    and token_hash = crypt(trim(p_token), token_hash)
  limit 1;
$$;
revoke execute on function match_setup_token(text) from public, anon, authenticated;
