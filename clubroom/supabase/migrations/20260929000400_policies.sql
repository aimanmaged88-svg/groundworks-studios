-- Row-level security. Every table gets RLS enabled; a table with no policy for
-- an operation denies it to anon and authenticated (service_role bypasses RLS
-- and is only ever used on the server).

-- ---------------------------------------------------------------------------
-- Reference data
-- ---------------------------------------------------------------------------
alter table public.sports enable row level security;
create policy sports_read on public.sports for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- Clubs and membership
-- ---------------------------------------------------------------------------
alter table public.clubs enable row level security;
create policy clubs_select on public.clubs for select to authenticated
  using (app.is_member(id));
create policy clubs_update on public.clubs for update to authenticated
  using (app.is_admin(id)) with check (app.is_admin(id));
-- insert happens through public.create_club(); delete only by the platform (service role).

-- What the world may see of a club: served through this view, not the table.
create view public.club_public with (security_invoker = false) as
  select c.slug, c.name, c.short_name, c.sport_key, c.logo_path, c.colours, c.theme_default,
         c.public_page, c.suburb, c.state, c.instagram_handle, c.website, c.is_demo,
         c.timezone
  from public.clubs c
  where c.status = 'active';
grant select on public.club_public to anon, authenticated;

alter table public.platform_users enable row level security;
create policy platform_users_self on public.platform_users for select to authenticated
  using (user_id = auth.uid());

alter table public.user_profiles enable row level security;
create policy user_profiles_self on public.user_profiles for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table public.club_users enable row level security;
create policy club_users_select on public.club_users for select to authenticated
  using (user_id = auth.uid() or app.is_admin(club_id));
create policy club_users_admin_write on public.club_users for update to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));
create policy club_users_admin_delete on public.club_users for delete to authenticated
  using (app.is_admin(club_id) and user_id <> auth.uid());
-- inserts happen through create_club() / accept_invite().

alter table public.invites enable row level security;
create policy invites_admin on public.invites for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

-- ---------------------------------------------------------------------------
-- Season structure: members read, admins write
-- ---------------------------------------------------------------------------
alter table public.venues enable row level security;
create policy venues_select on public.venues for select to authenticated using (app.is_member(club_id));
create policy venues_write on public.venues for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.seasons enable row level security;
create policy seasons_select on public.seasons for select to authenticated using (app.is_member(club_id));
create policy seasons_write on public.seasons for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.divisions enable row level security;
create policy divisions_select on public.divisions for select to authenticated using (app.is_member(club_id));
create policy divisions_write on public.divisions for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.teams enable row level security;
create policy teams_select on public.teams for select to authenticated using (app.is_member(club_id));
create policy teams_write on public.teams for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.level_config enable row level security;
create policy level_config_select on public.level_config for select to authenticated using (app.is_member(club_id));
create policy level_config_write on public.level_config for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.form_templates enable row level security;
create policy form_templates_select on public.form_templates for select to authenticated using (app.is_member(club_id));
create policy form_templates_write on public.form_templates for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

-- ---------------------------------------------------------------------------
-- People and families
-- ---------------------------------------------------------------------------
alter table public.people enable row level security;
create policy people_select on public.people for select to authenticated
  using (app.is_admin(club_id) or app.is_self(id) or app.is_guardian_of(id) or app.coaches_person(id));
create policy people_insert on public.people for insert to authenticated
  with check (app.is_admin(club_id));
create policy people_update on public.people for update to authenticated
  using (app.is_admin(club_id) or app.is_self(id))
  with check (app.is_admin(club_id) or app.is_self(id));
-- no delete: archive instead.

alter table public.guardianships enable row level security;
create policy guardianships_select on public.guardianships for select to authenticated
  using (app.is_admin(club_id) or app.is_self(guardian_person_id) or app.is_self(child_person_id) or app.coaches_person(child_person_id));
create policy guardianships_write on public.guardianships for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

-- No SELECT policy on purpose: reads go through get_person_sensitive(), which audits.
alter table public.person_sensitive enable row level security;
create policy person_sensitive_admin_write on public.person_sensitive for insert to authenticated
  with check (app.is_admin(club_id));
create policy person_sensitive_admin_update on public.person_sensitive for update to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.team_members enable row level security;
create policy team_members_select on public.team_members for select to authenticated
  using (app.is_admin(club_id) or app.coaches_team(team_id) or app.is_self(person_id) or app.is_guardian_of(person_id));
create policy team_members_write on public.team_members for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

-- ---------------------------------------------------------------------------
-- Registrations and consents
-- ---------------------------------------------------------------------------
alter table public.registrations enable row level security;
create policy registrations_select on public.registrations for select to authenticated
  using (app.is_admin(club_id) or app.is_guardian_of(player_person_id) or app.is_self(player_person_id) or app.coaches_person(player_person_id));
create policy registrations_insert on public.registrations for insert to authenticated
  with check (app.is_admin(club_id));
create policy registrations_update on public.registrations for update to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));
-- public submissions arrive through submit_registration() from the server.

alter table public.consents enable row level security;
create policy consents_select on public.consents for select to authenticated
  using (app.is_admin(club_id) or app.is_guardian_of(person_id) or app.coaches_person(person_id));
create policy consents_insert on public.consents for insert to authenticated
  with check (app.is_admin(club_id));
-- consents are immutable; a new row supersedes.

-- ---------------------------------------------------------------------------
-- Events, availability, attendance, progression
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;
create policy events_select on public.events for select to authenticated
  using (
    app.is_admin(club_id)
    or (team_id is null and app.is_member(club_id))
    or app.coaches_team(team_id)
    or app.family_on_team(team_id)
  );
create policy events_write on public.events for all to authenticated
  using (app.is_admin(club_id) or app.coaches_team(team_id))
  with check (app.is_admin(club_id) or app.coaches_team(team_id));

alter table public.availability enable row level security;
create policy availability_select on public.availability for select to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id) or app.is_guardian_of(person_id) or app.is_self(person_id));
create policy availability_write on public.availability for all to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id) or app.is_guardian_of(person_id) or app.is_self(person_id))
  with check (app.is_admin(club_id) or app.coaches_person(person_id) or app.is_guardian_of(person_id) or app.is_self(person_id));

alter table public.attendance enable row level security;
create policy attendance_select on public.attendance for select to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id) or app.is_guardian_of(person_id) or app.is_self(person_id));
create policy attendance_write on public.attendance for all to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id))
  with check (app.is_admin(club_id) or app.coaches_person(person_id));

alter table public.skill_ratings enable row level security;
create policy skill_ratings_select on public.skill_ratings for select to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id) or app.is_guardian_of(person_id) or app.is_self(person_id));
create policy skill_ratings_insert on public.skill_ratings for insert to authenticated
  with check ((app.is_admin(club_id) or app.coaches_person(person_id)) and rated_by = auth.uid());

alter table public.coach_notes enable row level security;
create policy coach_notes_select on public.coach_notes for select to authenticated
  using (app.is_admin(club_id) or app.coaches_person(person_id));
create policy coach_notes_insert on public.coach_notes for insert to authenticated
  with check ((app.is_admin(club_id) or app.coaches_person(person_id)) and author_user_id = auth.uid());
create policy coach_notes_own on public.coach_notes for update to authenticated
  using (author_user_id = auth.uid()) with check (author_user_id = auth.uid());
create policy coach_notes_own_delete on public.coach_notes for delete to authenticated
  using (author_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Money
-- ---------------------------------------------------------------------------
alter table public.fees enable row level security;
create policy fees_select on public.fees for select to authenticated
  using (app.is_admin(club_id) or app.is_guardian_of(person_id) or app.is_self(person_id));
create policy fees_write on public.fees for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.payments enable row level security;
create policy payments_select on public.payments for select to authenticated
  using (
    app.is_admin(club_id)
    or exists (select 1 from public.fees f where f.id = fee_id and (app.is_guardian_of(f.person_id) or app.is_self(f.person_id)))
  );
create policy payments_write on public.payments for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

-- ---------------------------------------------------------------------------
-- Operations
-- ---------------------------------------------------------------------------
alter table public.tasks enable row level security;
create policy tasks_admin on public.tasks for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.notices enable row level security;
create policy notices_select on public.notices for select to authenticated
  using (app.is_admin(club_id) or (published_at is not null and app.is_member(club_id)));
create policy notices_write on public.notices for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.submissions enable row level security;
create policy submissions_select on public.submissions for select to authenticated
  using (app.is_admin(club_id) or submitted_by = auth.uid());
create policy submissions_insert on public.submissions for insert to authenticated
  with check (app.is_member(club_id) and submitted_by = auth.uid());
create policy submissions_update on public.submissions for update to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.coach_clearances enable row level security;
create policy coach_clearances_select on public.coach_clearances for select to authenticated
  using (app.is_admin(club_id) or app.is_self(person_id));
create policy coach_clearances_write on public.coach_clearances for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.imports enable row level security;
create policy imports_admin on public.imports for all to authenticated
  using (app.is_admin(club_id)) with check (app.is_admin(club_id));

alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (app.is_admin(club_id));
-- written only by the Stripe webhook (service role).

alter table public.audit_log enable row level security;
create policy audit_log_select on public.audit_log for select to authenticated
  using (app.is_admin(club_id));
-- inserts only through app.log() and the server.

alter table public.rate_limits enable row level security;
-- service role only.
