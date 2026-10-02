-- Self-onboarding invites. An admin mints a link in two taps; the coach or the
-- family opens it and types their own details, which land straight in the
-- database with an account. One use, 14 days, bcrypt-hashed token at rest.
create table invites (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null check (kind in ('coach','family')),
  label      text not null default '',
  token_hash text not null,
  expires_at timestamptz not null default now() + interval '14 days',
  used_at    timestamptz,
  created_by uuid,
  created_at timestamptz not null default now()
);
alter table invites enable row level security;
create policy invites_admin_read on invites for select using (is_admin());

-- Admins mint invite tokens from inside the app; the plain token is returned
-- exactly once and only its hash is stored.
create or replace function create_invite(p_kind text, p_label text default '')
returns text language plpgsql security definer set search_path = public, extensions as $$
declare tok text;
begin
  if not is_admin() then raise exception 'admins only'; end if;
  if p_kind not in ('coach','family') then raise exception 'bad kind'; end if;
  tok := translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_');
  insert into invites (kind, label, token_hash, created_by)
  values (p_kind, coalesce(p_label, ''), crypt(tok, gen_salt('bf')), auth.uid());
  return tok;
end $$;
revoke execute on function create_invite(text, text) from public, anon;

create or replace function match_invite(p_token text) returns invites
language sql stable security definer set search_path = public, extensions as $$
  select * from invites
  where used_at is null and expires_at > now()
    and token_hash = crypt(trim(p_token), token_hash)
  limit 1;
$$;
revoke execute on function match_invite(text) from public, anon, authenticated;
