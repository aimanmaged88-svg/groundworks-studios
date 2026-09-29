-- RLS helper functions. All are STABLE, SECURITY DEFINER (so they can read the
-- membership tables regardless of the caller's policies) and pin search_path.
-- They are the single vocabulary the policies are written in.

create or replace function app.is_platform_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_users pu where pu.user_id = auth.uid());
$$;

create or replace function app.is_member(p_club uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.club_users cu
    where cu.club_id = p_club and cu.user_id = auth.uid() and cu.status = 'active'
  ) or app.is_platform_owner();
$$;

create or replace function app.has_role(p_club uuid, p_role public.club_role)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.club_users cu
    where cu.club_id = p_club and cu.user_id = auth.uid()
      and cu.role = p_role and cu.status = 'active'
  );
$$;

create or replace function app.is_admin(p_club uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app.has_role(p_club, 'admin') or app.is_platform_owner();
$$;

-- The person row that is "me" in a club (a guardian, a player 13+, or a coach).
create or replace function app.is_self(p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.people p where p.id = p_person and p.user_id = auth.uid()
  );
$$;

create or replace function app.is_guardian_of(p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.guardianships g
    join public.people gp on gp.id = g.guardian_person_id
    where g.child_person_id = p_person and gp.user_id = auth.uid()
  );
$$;

create or replace function app.coaches_team(p_team uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members tm
    join public.people p on p.id = tm.person_id
    where tm.team_id = p_team and tm.role in ('coach', 'manager') and p.user_id = auth.uid()
  );
$$;

-- True when the caller coaches (or manages) a team the person plays in.
create or replace function app.coaches_person(p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.team_members tp
    join public.team_members tc on tc.team_id = tp.team_id and tc.role in ('coach', 'manager')
    join public.people cp on cp.id = tc.person_id
    where tp.person_id = p_person and tp.role = 'player' and cp.user_id = auth.uid()
  );
$$;

create or replace function app.club_of_person(p_person uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select p.club_id from public.people p where p.id = p_person;
$$;

-- Basic profile visibility: admins of the club, the person, their guardians, their coaches.
create or replace function app.can_view_person(p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_admin(app.club_of_person(p_person))
      or app.is_self(p_person)
      or app.is_guardian_of(p_person)
      or app.coaches_person(p_person);
$$;

-- Medical and emergency details: admins, guardians, and the child's own coaches. Never the player.
create or replace function app.can_view_sensitive(p_person uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select app.is_admin(app.club_of_person(p_person))
      or app.is_guardian_of(p_person)
      or app.coaches_person(p_person);
$$;

create or replace function app.club_of_event(p_event uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select e.club_id from public.events e where e.id = p_event;
$$;

create or replace function app.team_of_event(p_event uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select e.team_id from public.events e where e.id = p_event;
$$;

-- A family member (guardian or the player) is on the event's team.
create or replace function app.family_on_team(p_team uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.team_members tm
    where tm.team_id = p_team and (app.is_self(tm.person_id) or app.is_guardian_of(tm.person_id))
  );
$$;

-- Append-only audit writer. actor is the caller; impersonation is read from a
-- transaction setting the platform layer sets when "viewing as" a club.
create or replace function app.log(
  p_club uuid, p_action text, p_table text default null, p_id text default null,
  p_detail jsonb default '{}'::jsonb, p_ip_hash text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (club_id, actor_user_id, impersonated_by, action, target_table, target_id, detail, ip_hash)
  values (
    p_club,
    auth.uid(),
    nullif(current_setting('app.impersonated_by', true), '')::uuid,
    p_action, p_table, p_id, coalesce(p_detail, '{}'::jsonb), p_ip_hash
  );
end;
$$;

grant execute on all functions in schema app to authenticated, anon, service_role;
alter default privileges in schema app grant execute on functions to authenticated, anon, service_role;
