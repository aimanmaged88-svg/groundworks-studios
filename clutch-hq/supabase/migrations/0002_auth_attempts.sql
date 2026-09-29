-- Failed code attempts, checked by the activation and kid-login functions.
-- Service role only: RLS is on and there are no policies.
create table auth_attempts (
  id    bigserial primary key,
  ip    text not null,
  kind  text not null,
  at    timestamptz not null default now()
);
create index auth_attempts_ip_idx on auth_attempts (ip, kind, at);
alter table auth_attempts enable row level security;

create or replace function recent_failures(p_ip text, p_kind text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from auth_attempts where ip = p_ip and kind = p_kind and at > now() - interval '15 minutes';
$$;
revoke execute on function recent_failures(text, text) from public, anon, authenticated;

create or replace function match_activation(p_email text, p_code text) returns activation_codes
language sql stable security definer set search_path = public, extensions as $$
  select * from activation_codes
  where lower(email) = lower(trim(p_email)) and used_at is null and expires_at > now()
    and code_hash = crypt(upper(trim(p_code)), code_hash)
  limit 1;
$$;
revoke execute on function match_activation(text, text) from public, anon, authenticated;

create or replace function match_player_code(p_code text) returns player_codes
language sql stable security definer set search_path = public, extensions as $$
  select * from player_codes
  where used_at is null and expires_at > now() and code_hash = crypt(trim(p_code), code_hash)
  limit 1;
$$;
revoke execute on function match_player_code(text) from public, anon, authenticated;
