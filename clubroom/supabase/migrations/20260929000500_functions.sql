-- Application functions: defaults, age groups, club creation, invites,
-- public registration, audited sensitive reads, rate limiting.

-- ---------------------------------------------------------------------------
-- Defaults for a new club's registration form (taken from the prototype)
-- ---------------------------------------------------------------------------
create or replace function app.default_form_fields()
returns jsonb language sql immutable set search_path = '' as $$
  select '[
    {"key":"player_first_name","label":"Player first name","type":"text","required":true,"section":"player","maps_to":"player.first_name"},
    {"key":"player_last_name","label":"Player last name","type":"text","required":true,"section":"player","maps_to":"player.last_name"},
    {"key":"dob","label":"Date of birth","type":"date","required":true,"section":"player","maps_to":"player.dob"},
    {"key":"gender","label":"Gender","type":"select","options":["Boy","Girl","Non-binary","Prefer not to say"],"required":false,"section":"player","maps_to":"player.gender"},
    {"key":"school","label":"School","type":"text","required":false,"section":"player","maps_to":"player.school"},
    {"key":"experience","label":"Experience","type":"select","options":["Brand new","Played a season or two","Plays representative or club elsewhere"],"required":false,"section":"player","maps_to":"registration.experience","help":"All skill levels are welcome, beginners included."},
    {"key":"uniform_size","label":"Uniform size","type":"select","options":["Youth S","Youth M","Youth L","Adult S","Adult M","Adult L","Adult XL"],"required":false,"section":"player","maps_to":"registration.uniform_size"},
    {"key":"guardian_first_name","label":"Your first name","type":"text","required":true,"section":"guardian","maps_to":"guardian.first_name"},
    {"key":"guardian_last_name","label":"Your last name","type":"text","required":true,"section":"guardian","maps_to":"guardian.last_name"},
    {"key":"relationship","label":"Relationship to the player","type":"select","options":["Mother","Father","Guardian","Other"],"required":false,"section":"guardian","maps_to":"guardian.relationship"},
    {"key":"guardian_mobile","label":"Mobile","type":"tel","required":true,"section":"guardian","maps_to":"guardian.mobile"},
    {"key":"guardian_email","label":"Email","type":"email","required":true,"section":"guardian","maps_to":"guardian.email","help":"This is where we confirm the registration."},
    {"key":"emergency_name","label":"Emergency contact name","type":"text","required":false,"section":"medical","maps_to":"sensitive.emergency_name"},
    {"key":"emergency_phone","label":"Emergency contact phone","type":"tel","required":false,"section":"medical","maps_to":"sensitive.emergency_phone"},
    {"key":"medical","label":"Conditions, allergies or medication","type":"textarea","required":true,"section":"medical","maps_to":"sensitive.medical","help":"Only club admins and the player''s coach can see this. If there is nothing, write None."},
    {"key":"ambulance_cover","label":"Ambulance cover","type":"select","options":["Yes","No","Not sure"],"required":false,"section":"medical","maps_to":"sensitive.ambulance_cover"},
    {"key":"notes","label":"Anything else we should know","type":"textarea","required":false,"section":"extra","maps_to":"registration.notes"},
    {"key":"heard_via","label":"How did you hear about us?","type":"select","options":["Word of mouth","Instagram","School","Saw a game","Already with the club","Other"],"required":false,"section":"extra","maps_to":"registration.heard_via"}
  ]'::jsonb;
$$;

create or replace function app.default_consents()
returns jsonb language sql immutable set search_path = '' as $$
  select '[
    {"key":"medical","label":"Medical treatment consent","required":true,"text":"If the club cannot reach me, I consent to the club arranging medical treatment for my child."},
    {"key":"conduct","label":"Code of conduct","required":true,"text":"My child and I will respect the referees, coaches, players and the venue."},
    {"key":"photos","label":"Photos and video","required":false,"text":"The club may use team photos and game footage on its channels. Optional: leave unticked to opt out."}
  ]'::jsonb;
$$;

-- ---------------------------------------------------------------------------
-- Age group from date of birth and a season's rule
-- ---------------------------------------------------------------------------
create or replace function public.age_group_for(p_dob date, p_season_id uuid)
returns text language plpgsql stable security definer set search_path = '' as $$
declare
  s public.seasons%rowtype;
  v_year int;
  v_age int;
  v_name text;
begin
  if p_dob is null then return null; end if;
  select * into s from public.seasons where id = p_season_id;
  if not found then return null; end if;

  if s.age_rule_mode = 'birth_year' then
    v_year := extract(year from p_dob)::int;
    select d.name into v_name from public.divisions d
    where d.season_id = s.id
      and (d.born_from is null or v_year >= d.born_from)
      and (d.born_to is null or v_year <= d.born_to)
    order by d.sort limit 1;
  else
    v_age := extract(year from age(s.age_cutoff_date, p_dob))::int;
    select d.name into v_name from public.divisions d
    where d.season_id = s.id
      and (d.min_age is null or v_age >= d.min_age)
      and (d.max_age is null or v_age <= d.max_age)
    order by d.sort limit 1;
  end if;
  return v_name;
end;
$$;

-- ---------------------------------------------------------------------------
-- has_medical_flag maintenance
-- ---------------------------------------------------------------------------
create or replace function app.medical_is_notable(p_text text)
returns boolean language sql immutable set search_path = '' as $$
  select p_text is not null
     and regexp_replace(lower(btrim(p_text)), '[.\s]+$', '') not in
         ('', 'none', 'nil', 'n/a', 'na', 'no', 'nothing', '-', 'nope', 'none known', 'no known', 'nil known');
$$;

create or replace function app.sync_medical_flag()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.people set has_medical_flag = app.medical_is_notable(new.medical) where id = new.person_id;
  return new;
end;
$$;
create trigger person_sensitive_flag after insert or update of medical on public.person_sensitive
  for each row execute function app.sync_medical_flag();

-- ---------------------------------------------------------------------------
-- Audit archive/restore on people
-- ---------------------------------------------------------------------------
create or replace function app.audit_people_archive()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.archived_at is distinct from old.archived_at then
    perform app.log(new.club_id, case when new.archived_at is null then 'person.restore' else 'person.archive' end,
      'people', new.id::text, jsonb_build_object('kind', new.kind));
  end if;
  return new;
end;
$$;
create trigger people_archive_audit after update on public.people
  for each row execute function app.audit_people_archive();

-- ---------------------------------------------------------------------------
-- Club creation (signup)
-- ---------------------------------------------------------------------------
create or replace function public.create_club(p_name text, p_slug text, p_sport_key text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  v_club uuid;
  v_sport public.sports%rowtype;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into v_sport from public.sports where key = p_sport_key;
  if not found then raise exception 'unknown sport %', p_sport_key; end if;

  insert into public.clubs (name, slug, sport_key, created_by)
  values (btrim(p_name), lower(p_slug), p_sport_key, v_uid)
  returning id into v_club;

  insert into public.club_users (club_id, user_id, role, status) values (v_club, v_uid, 'admin', 'active');

  insert into public.user_profiles (user_id, last_club_id) values (v_uid, v_club)
  on conflict (user_id) do update set last_club_id = excluded.last_club_id;

  insert into public.subscriptions (club_id, plan, status, trial_ends_at, member_limit)
  values (v_club, 'club', 'trialing', now() + interval '30 days', 400);

  insert into public.level_config (club_id, levels, skills, badges)
  values (v_club, v_sport.default_levels, v_sport.default_skills, v_sport.default_badges);

  insert into public.form_templates (club_id, version, fields, consents, is_active, published_at, created_by)
  values (v_club, 1, app.default_form_fields(), app.default_consents(), true, now(), v_uid);

  perform app.log(v_club, 'club.create', 'clubs', v_club::text, jsonb_build_object('sport', p_sport_key));
  return v_club;
end;
$$;

-- ---------------------------------------------------------------------------
-- Invites
-- ---------------------------------------------------------------------------
create or replace function public.create_invite(p_club uuid, p_email text, p_role public.club_role, p_person_id uuid default null)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_token text;
begin
  if not app.is_admin(p_club) then raise exception 'not allowed' using errcode = '42501'; end if;
  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.invites (club_id, email, role, person_id, token_hash, invited_by)
  values (p_club, p_email, p_role, p_person_id, encode(extensions.digest(v_token, 'sha256'), 'hex'), auth.uid());
  perform app.log(p_club, 'invite.create', 'invites', null, jsonb_build_object('role', p_role));
  return v_token;
end;
$$;

create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := auth.uid();
  inv public.invites%rowtype;
begin
  if v_uid is null then raise exception 'not signed in' using errcode = '42501'; end if;
  select * into inv from public.invites
  where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex') and accepted_at is null and expires_at > now();
  if not found then raise exception 'invite not found or expired'; end if;

  insert into public.club_users (club_id, user_id, role, status, invited_by)
  values (inv.club_id, v_uid, inv.role, 'active', inv.invited_by)
  on conflict (club_id, user_id, role) do update set status = 'active';

  if inv.person_id is not null then
    update public.people set user_id = v_uid where id = inv.person_id and user_id is null;
  end if;

  insert into public.user_profiles (user_id, last_club_id) values (v_uid, inv.club_id)
  on conflict (user_id) do update set last_club_id = excluded.last_club_id;

  update public.invites set accepted_at = now(), accepted_by = v_uid where id = inv.id;
  perform app.log(inv.club_id, 'invite.accept', 'invites', inv.id::text, jsonb_build_object('role', inv.role));
  return inv.club_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Public form: everything the registration page needs, for anon callers
-- ---------------------------------------------------------------------------
create or replace function public.get_public_form(p_slug text)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'club', jsonb_build_object(
      'slug', c.slug, 'name', c.name, 'short_name', c.short_name, 'sport_key', c.sport_key,
      'logo_path', c.logo_path, 'colours', c.colours, 'theme_default', c.theme_default,
      'public_page', c.public_page, 'suburb', c.suburb, 'state', c.state,
      'instagram_handle', c.instagram_handle, 'website', c.website, 'is_demo', c.is_demo,
      'timezone', c.timezone, 'contact_email', c.contact_email, 'contact_phone', c.contact_phone,
      'vocabulary', coalesce(s.vocabulary, '{}'::jsonb) || coalesce(c.settings -> 'vocabulary', '{}'::jsonb)
    ),
    'form', (select jsonb_build_object('id', f.id, 'version', f.version, 'intro', f.intro,
                'collection_notice', f.collection_notice, 'fields', f.fields, 'consents', f.consents)
             from public.form_templates f where f.club_id = c.id and f.is_active),
    'season', (select jsonb_build_object('id', se.id, 'name', se.name, 'starts_on', se.starts_on,
                'fee_cents', se.fee_cents, 'fee_label', se.fee_label, 'registration_open', se.registration_open,
                'age_rule_mode', se.age_rule_mode, 'age_cutoff_date', se.age_cutoff_date,
                'divisions', (select coalesce(jsonb_agg(jsonb_build_object('name', d.name, 'sort', d.sort,
                    'born_from', d.born_from, 'born_to', d.born_to, 'min_age', d.min_age, 'max_age', d.max_age, 'gender', d.gender)
                    order by d.sort), '[]'::jsonb) from public.divisions d where d.season_id = se.id))
               from public.seasons se where se.club_id = c.id and se.is_current)
  )
  from public.clubs c
  left join public.sports s on s.key = c.sport_key
  where c.slug = lower(p_slug) and c.status = 'active';
$$;
grant execute on function public.get_public_form(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Public registration. Called by the server (service role) after validation
-- and rate limiting. Atomic: guardian, player, guardianship, sensitive,
-- registration, consents, fee.
-- ---------------------------------------------------------------------------
create or replace function public.submit_registration(
  p_club_slug text, p_payload jsonb, p_ip_hash text default null, p_user_agent text default null,
  p_source public.registration_source default 'public_form'
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  c public.clubs%rowtype;
  v_form public.form_templates%rowtype;
  v_season public.seasons%rowtype;
  pl jsonb := p_payload -> 'player';
  gu jsonb := p_payload -> 'guardian';
  se jsonb := coalesce(p_payload -> 'sensitive', '{}'::jsonb);
  rg jsonb := coalesce(p_payload -> 'registration', '{}'::jsonb);
  v_guardian uuid;
  v_player uuid;
  v_reg uuid;
  v_dup boolean := false;
  v_consent jsonb;
  v_photo boolean;
begin
  select * into c from public.clubs where slug = lower(p_club_slug);
  if not found then raise exception 'club not found'; end if;
  if p_source = 'public_form' and c.status <> 'active' then raise exception 'club not live'; end if;

  select * into v_form from public.form_templates where club_id = c.id and is_active;
  select * into v_season from public.seasons where club_id = c.id and is_current;
  if p_source = 'public_form' and v_season.id is not null and not v_season.registration_open then
    raise exception 'registrations closed';
  end if;

  if coalesce(btrim(pl ->> 'first_name'), '') = '' then raise exception 'player first name required'; end if;

  -- Guardian: reuse by email within the club, otherwise create.
  if coalesce(gu ->> 'email', '') <> '' then
    select id into v_guardian from public.people
    where club_id = c.id and kind = 'guardian' and email = (gu ->> 'email')::extensions.citext and archived_at is null
    limit 1;
  end if;
  if v_guardian is null and gu is not null and coalesce(btrim(gu ->> 'first_name'), '') <> '' then
    insert into public.people (club_id, kind, first_name, last_name, email, mobile)
    values (c.id, 'guardian', btrim(gu ->> 'first_name'), coalesce(btrim(gu ->> 'last_name'), ''),
            nullif(gu ->> 'email', ''), nullif(gu ->> 'mobile', ''))
    returning id into v_guardian;
  elsif v_guardian is not null then
    update public.people set
      mobile = coalesce(nullif(gu ->> 'mobile', ''), mobile),
      first_name = coalesce(nullif(btrim(gu ->> 'first_name'), ''), first_name),
      last_name = coalesce(nullif(btrim(gu ->> 'last_name'), ''), last_name)
    where id = v_guardian;
  end if;

  -- Player: reuse by name + date of birth within the club.
  if (pl ->> 'dob') is not null then
    select id into v_player from public.people
    where club_id = c.id and kind = 'player' and archived_at is null
      and lower(first_name) = lower(btrim(pl ->> 'first_name'))
      and lower(last_name) = lower(coalesce(btrim(pl ->> 'last_name'), ''))
      and dob = (pl ->> 'dob')::date
    limit 1;
  end if;
  if v_player is null then
    insert into public.people (club_id, kind, first_name, last_name, dob, gender, school)
    values (c.id, 'player', btrim(pl ->> 'first_name'), coalesce(btrim(pl ->> 'last_name'), ''),
            (pl ->> 'dob')::date, nullif(pl ->> 'gender', ''), nullif(pl ->> 'school', ''))
    returning id into v_player;
  else
    v_dup := exists (select 1 from public.registrations r where r.player_person_id = v_player
                     and (v_season.id is null or r.season_id = v_season.id) and r.status <> 'withdrawn');
    update public.people set
      gender = coalesce(nullif(pl ->> 'gender', ''), gender),
      school = coalesce(nullif(pl ->> 'school', ''), school)
    where id = v_player;
  end if;

  if v_guardian is not null then
    insert into public.guardianships (club_id, guardian_person_id, child_person_id, relationship)
    values (c.id, v_guardian, v_player, nullif(gu ->> 'relationship', ''))
    on conflict (guardian_person_id, child_person_id) do update
      set relationship = coalesce(excluded.relationship, public.guardianships.relationship);
  end if;

  insert into public.person_sensitive (person_id, club_id, medical, ambulance_cover, emergency_name, emergency_phone, emergency_relationship)
  values (v_player, c.id, nullif(se ->> 'medical', ''), nullif(se ->> 'ambulance_cover', ''),
          nullif(se ->> 'emergency_name', ''), nullif(se ->> 'emergency_phone', ''), nullif(se ->> 'emergency_relationship', ''))
  on conflict (person_id) do update set
    medical = coalesce(excluded.medical, public.person_sensitive.medical),
    ambulance_cover = coalesce(excluded.ambulance_cover, public.person_sensitive.ambulance_cover),
    emergency_name = coalesce(excluded.emergency_name, public.person_sensitive.emergency_name),
    emergency_phone = coalesce(excluded.emergency_phone, public.person_sensitive.emergency_phone),
    emergency_relationship = coalesce(excluded.emergency_relationship, public.person_sensitive.emergency_relationship),
    updated_at = now();

  insert into public.registrations (club_id, season_id, form_template_id, form_version, player_person_id, guardian_person_id,
    uniform_size, experience, heard_via, notes, custom, source, possible_duplicate, submitted_at, ip_hash, user_agent)
  values (c.id, v_season.id, v_form.id, v_form.version, v_player, v_guardian,
    nullif(rg ->> 'uniform_size', ''), nullif(rg ->> 'experience', ''), nullif(rg ->> 'heard_via', ''), nullif(rg ->> 'notes', ''),
    coalesce(p_payload -> 'custom', '{}'::jsonb), p_source, v_dup,
    coalesce((p_payload ->> 'submitted_at')::timestamptz, now()), p_ip_hash, p_user_agent)
  returning id into v_reg;

  for v_consent in select * from jsonb_array_elements(coalesce(p_payload -> 'consents', '[]'::jsonb)) loop
    insert into public.consents (club_id, registration_id, person_id, consent_key, granted, text_shown, form_version, granted_at, granted_by_person_id)
    values (c.id, v_reg, v_player, v_consent ->> 'key', coalesce((v_consent ->> 'granted')::boolean, false),
            coalesce(v_consent ->> 'text_shown', ''), v_form.version,
            coalesce((p_payload ->> 'submitted_at')::timestamptz, now()), v_guardian);
    if v_consent ->> 'key' = 'photos' then v_photo := coalesce((v_consent ->> 'granted')::boolean, false); end if;
  end loop;
  if v_photo is not null then update public.people set photo_consent = v_photo where id = v_player; end if;

  if v_season.id is not null and v_season.fee_cents is not null and v_season.fee_cents > 0 then
    insert into public.fees (club_id, season_id, person_id, amount_cents, status)
    select c.id, v_season.id, v_player, v_season.fee_cents, 'owing'
    where not exists (select 1 from public.fees f where f.season_id = v_season.id and f.person_id = v_player);
  end if;

  perform app.log(c.id, 'registration.submit', 'registrations', v_reg::text,
    jsonb_build_object('source', p_source, 'possible_duplicate', v_dup), p_ip_hash);
  return v_reg;
end;
$$;
revoke execute on function public.submit_registration(text, jsonb, text, text, public.registration_source) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Audited read of sensitive details
-- ---------------------------------------------------------------------------
create or replace function public.get_person_sensitive(p_person_id uuid)
returns table (
  medical text, ambulance_cover text, emergency_name text, emergency_phone text,
  emergency_relationship text, updated_at timestamptz
) language plpgsql stable security definer set search_path = '' as $$
declare
  v_club uuid;
begin
  if not app.can_view_sensitive(p_person_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_club := app.club_of_person(p_person_id);
  perform app.log(v_club, 'sensitive.view', 'person_sensitive', p_person_id::text);
  return query
    select ps.medical, ps.ambulance_cover, ps.emergency_name, ps.emergency_phone, ps.emergency_relationship, ps.updated_at
    from public.person_sensitive ps where ps.person_id = p_person_id;
end;
$$;

-- STABLE functions cannot write in strict SQL terms; plpgsql allows the insert
-- inside a select-only context only when the function is VOLATILE. Make it so.
alter function public.get_person_sensitive(uuid) volatile;

create or replace function public.upsert_person_sensitive(
  p_person_id uuid, p_medical text, p_ambulance_cover text,
  p_emergency_name text, p_emergency_phone text, p_emergency_relationship text
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_club uuid := app.club_of_person(p_person_id);
begin
  if v_club is null or not (app.is_admin(v_club) or app.is_guardian_of(p_person_id)) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.person_sensitive (person_id, club_id, medical, ambulance_cover, emergency_name, emergency_phone, emergency_relationship, updated_by)
  values (p_person_id, v_club, nullif(p_medical, ''), nullif(p_ambulance_cover, ''), nullif(p_emergency_name, ''),
          nullif(p_emergency_phone, ''), nullif(p_emergency_relationship, ''), auth.uid())
  on conflict (person_id) do update set
    medical = excluded.medical, ambulance_cover = excluded.ambulance_cover,
    emergency_name = excluded.emergency_name, emergency_phone = excluded.emergency_phone,
    emergency_relationship = excluded.emergency_relationship, updated_by = auth.uid(), updated_at = now();
  perform app.log(v_club, 'sensitive.update', 'person_sensitive', p_person_id::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- Rate limiting for public endpoints (server only)
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_hit(p_key text, p_limit int, p_window interval)
returns boolean language plpgsql security definer set search_path = '' as $$
declare
  v_count int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, now(), 1)
  on conflict (key) do update set
    count = case when public.rate_limits.window_start < now() - p_window then 1 else public.rate_limits.count + 1 end,
    window_start = case when public.rate_limits.window_start < now() - p_window then now() else public.rate_limits.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke execute on function public.rate_limit_hit(text, int, interval) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Convenience: the clubs I belong to, with my roles
-- ---------------------------------------------------------------------------
create or replace function public.my_clubs()
returns table (club_id uuid, slug text, name text, logo_path text, colours jsonb, is_demo boolean, status public.club_status, roles public.club_role[])
language sql stable security definer set search_path = '' as $$
  select c.id, c.slug, c.name, c.logo_path, c.colours, c.is_demo, c.status, array_agg(cu.role order by cu.role)
  from public.club_users cu
  join public.clubs c on c.id = cu.club_id
  where cu.user_id = auth.uid() and cu.status = 'active'
  group by c.id;
$$;
