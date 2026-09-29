-- The demo club. Every name here is invented; the surname "Demo" is on purpose
-- so nothing in it can be mistaken for a real family. Safe to run again: it
-- removes and recreates the club. Only ever targets a club with is_demo = true.

do $$
declare
  v_club uuid;
  v_season uuid;
  v_form uuid;
  v_admin uuid := 'd0000000-0000-4000-8000-000000000001';
  v_coach1 uuid := 'd0000000-0000-4000-8000-000000000002';
  v_coach2 uuid := 'd0000000-0000-4000-8000-000000000003';
  v_parent uuid := 'd0000000-0000-4000-8000-000000000004';
  v_venue uuid;
  v_t_u12 uuid; v_t_u14 uuid; v_t_u16 uuid;
  v_p_coach1 uuid; v_p_coach2 uuid;
  first_names text[] := array['Zara','Kai','Amira','Leo','Noor','Ezra','Layla','Theo','Sana','Milo','Hana','Rafi','Ines','Otis','Mira','Jude','Lina','Ari','Yusra','Finn','Dalia','Cyrus','Nadia','Ravi','Elif','Bodhi','Suri','Kian','Maya','Idris','Ayla','Remy','Zoya','Luca','Farah','Nico','Leila','Omar','Aria','Emre'];
  genders text[] := array['Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy','Girl','Boy'];
  schools text[] := array['Riverside Primary','Hillcrest Public','St Example''s','Parkview High','Bankstown Central'];
  experiences text[] := array['Brand new','Played a season or two','Plays representative or club elsewhere'];
  heard text[] := array['Word of mouth','Instagram','School','Saw a game','Already with the club'];
  sizes text[] := array['Youth S','Youth M','Youth L','Adult S','Adult M'];
  i int;
  v_dob date;
  v_player uuid;
  v_guardian uuid;
  v_reg uuid;
  v_medical text;
begin
  -- Never touch a real club: only delete the demo slug when it is flagged as demo.
  delete from public.clubs where slug = 'demo-hoops' and is_demo;
  delete from auth.users where id in (v_admin, v_coach1, v_coach2, v_parent);

  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  values
    (v_admin,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@demo.clubroom.local',  extensions.crypt('demo-admin-2026',  extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dana Demo"}', now(), now()),
    (v_coach1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach@demo.clubroom.local',  extensions.crypt('demo-coach-2026',  extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Casey Demo"}', now(), now()),
    (v_coach2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach2@demo.clubroom.local', extensions.crypt('demo-coach-2026',  extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Jordan Demo"}', now(), now()),
    (v_parent, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'parent@demo.clubroom.local', extensions.crypt('demo-parent-2026', extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Sam Demo"}', now(), now());

  insert into public.clubs (slug, name, short_name, sport_key, status, is_demo, suburb, state, colours, theme_default, instagram_handle, contact_email, public_page)
  values ('demo-hoops', 'Demo Hoops Basketball', 'Demo Hoops', 'basketball', 'active', true, 'Sampleton', 'NSW',
          '{"primary":"#1f6feb","accent":"#f2b705","on_primary":"#ffffff"}', 'dark', 'demohoops', 'hello@demo.clubroom.local',
          '{"headline":"Summer comp registrations are open","blurb":"This is a demo club with made-up players, so you can click around and see how it works. Nothing here is real.","when":"Fridays 5-8pm","where":"Demo Stadium, Sampleton"}')
  returning id into v_club;

  insert into public.club_users (club_id, user_id, role) values
    (v_club, v_admin, 'admin'), (v_club, v_coach1, 'coach'), (v_club, v_coach2, 'coach'), (v_club, v_parent, 'parent');
  insert into public.user_profiles (user_id, full_name, last_club_id) values
    (v_admin, 'Dana Demo', v_club), (v_coach1, 'Casey Demo', v_club), (v_coach2, 'Jordan Demo', v_club), (v_parent, 'Sam Demo', v_club)
  on conflict (user_id) do update set last_club_id = excluded.last_club_id;

  insert into public.subscriptions (club_id, plan, status, trial_ends_at, member_limit) values (v_club, 'club', 'trialing', now() + interval '30 days', 400);
  insert into public.level_config (club_id, levels, skills, badges) select v_club, default_levels, default_skills, default_badges from public.sports where key = 'basketball';
  insert into public.form_templates (club_id, version, fields, consents, is_active, published_at, intro, collection_notice)
  values (v_club, 1, app.default_form_fields(), app.default_consents(), true, now(), 'Takes about three minutes. One form per child.', 'We collect these details to run the season safely. They are stored in Australia and only club admins and your child''s coach can see the medical parts.')
  returning id into v_form;

  insert into public.venues (club_id, name, address) values (v_club, 'Demo Stadium', '1 Sample Street, Sampleton NSW 2000') returning id into v_venue;

  insert into public.seasons (club_id, name, starts_on, ends_on, age_rule_mode, age_cutoff_date, fee_cents, fee_label, registration_open, is_current)
  values (v_club, 'Summer 2026/27', '2026-10-10', '2027-03-20', 'age_at_date', '2026-12-31', 18000, 'per player, per season', true, true)
  returning id into v_season;
  insert into public.divisions (club_id, season_id, name, sort, min_age, max_age) values
    (v_club, v_season, 'U10', 1, null, 9), (v_club, v_season, 'U12', 2, 10, 11), (v_club, v_season, 'U14', 3, 12, 13), (v_club, v_season, 'U16', 4, 14, 15), (v_club, v_season, 'U18', 5, 16, 17);

  insert into public.people (club_id, kind, first_name, last_name, email, user_id) values (v_club, 'staff', 'Casey', 'Demo', 'coach@demo.clubroom.local', v_coach1) returning id into v_p_coach1;
  insert into public.people (club_id, kind, first_name, last_name, email, user_id) values (v_club, 'staff', 'Jordan', 'Demo', 'coach2@demo.clubroom.local', v_coach2) returning id into v_p_coach2;
  insert into public.coach_clearances (club_id, person_id, kind, number_last4, expires_on, verified_at) values
    (v_club, v_p_coach1, 'wwcc', '1234', current_date + interval '400 days', now()),
    (v_club, v_p_coach2, 'wwcc', '5678', current_date + interval '20 days', now());

  insert into public.teams (club_id, season_id, division_id, name, colour, venue_id) select v_club, v_season, d.id, 'U12 Comets', '#1f6feb', v_venue from public.divisions d where d.season_id = v_season and d.name = 'U12' returning id into v_t_u12;
  insert into public.teams (club_id, season_id, division_id, name, colour, venue_id) select v_club, v_season, d.id, 'U14 Rockets', '#f2b705', v_venue from public.divisions d where d.season_id = v_season and d.name = 'U14' returning id into v_t_u14;
  insert into public.teams (club_id, season_id, division_id, name, colour, venue_id) select v_club, v_season, d.id, 'U16 Storm', '#e0362c', v_venue from public.divisions d where d.season_id = v_season and d.name = 'U16' returning id into v_t_u16;
  insert into public.team_members (club_id, team_id, person_id, role) values (v_club, v_t_u12, v_p_coach1, 'coach'), (v_club, v_t_u14, v_p_coach1, 'coach'), (v_club, v_t_u16, v_p_coach2, 'coach');

  for i in 1..40 loop
    -- ages 8 to 16 at the cutoff, spread across the groups
    v_dob := ('2026-12-31'::date - ((8 + (i % 9)) * interval '1 year') - ((i * 37) % 300) * interval '1 day')::date;
    v_medical := case when i % 7 = 0 then 'Asthma, carries an inhaler' when i % 11 = 0 then 'Nut allergy, EpiPen in bag' else 'None' end;
    v_guardian := null;
    -- every fourth child shares a guardian with the previous one (siblings)
    if i % 4 = 0 then
      select guardian_person_id into v_guardian from public.registrations where club_id = v_club order by submitted_at desc limit 1;
    end if;
    if v_guardian is null then
      insert into public.people (club_id, kind, first_name, last_name, email, mobile, user_id)
      values (v_club, 'guardian', 'Parent ' || i, 'Demo', 'parent' || i || '@demo.clubroom.local', '0400 000 ' || lpad(i::text, 3, '0'), case when i = 1 then v_parent else null end)
      returning id into v_guardian;
    end if;
    insert into public.people (club_id, kind, first_name, last_name, dob, gender, school, has_medical_flag, photo_consent)
    values (v_club, 'player', first_names[i], 'Demo', v_dob, genders[i], schools[1 + (i % 5)], v_medical <> 'None', i % 9 <> 0)
    returning id into v_player;
    insert into public.guardianships (club_id, guardian_person_id, child_person_id, relationship) values (v_club, v_guardian, v_player, (case when i % 3 = 0 then 'Father' else 'Mother' end)::text);
    insert into public.person_sensitive (person_id, club_id, medical, ambulance_cover, emergency_name, emergency_phone, emergency_relationship)
    values (v_player, v_club, v_medical, case when i % 5 = 0 then 'Not sure' else 'Yes' end, 'Emergency ' || i || ' Demo', '0400 111 ' || lpad(i::text, 3, '0'), 'Aunt');
    insert into public.registrations (club_id, season_id, form_template_id, form_version, player_person_id, guardian_person_id, uniform_size, experience, heard_via, notes, source, status, submitted_at)
    values (v_club, v_season, v_form, 1, v_player, v_guardian, sizes[1 + (i % 5)], experiences[1 + (i % 3)], heard[1 + (i % 5)],
            case when i % 6 = 0 then 'Would love to play with a friend from school.' else null end,
            (case when i % 10 = 0 then 'admin' else 'public_form' end)::public.registration_source,
            (case when i <= 30 then 'placed' when i <= 36 then 'reviewed' else 'new' end)::public.registration_status,
            now() - (i * 19 % 40) * interval '1 day' - (i * 7 % 24) * interval '1 hour')
    returning id into v_reg;
    insert into public.consents (club_id, registration_id, person_id, consent_key, granted, text_shown, form_version, granted_at, granted_by_person_id) values
      (v_club, v_reg, v_player, 'medical', true, 'If the club cannot reach me, I consent to the club arranging medical treatment for my child.', 1, now() - (i * 19 % 40) * interval '1 day', v_guardian),
      (v_club, v_reg, v_player, 'conduct', true, 'My child and I will respect the referees, coaches, players and the venue.', 1, now() - (i * 19 % 40) * interval '1 day', v_guardian),
      (v_club, v_reg, v_player, 'photos', i % 9 <> 0, 'The club may use team photos and game footage on its channels.', 1, now() - (i * 19 % 40) * interval '1 day', v_guardian);
    insert into public.fees (club_id, season_id, person_id, amount_cents, status, due_on)
    values (v_club, v_season, v_player, 18000, (case when i % 5 = 0 then 'owing' when i % 13 = 0 then 'partial' when i % 17 = 0 then 'waived' else 'paid' end)::public.fee_status, '2026-10-31');
    -- team placement by age group
    if i <= 30 then
      insert into public.team_members (club_id, team_id, person_id, role)
      select v_club, case public.age_group_for(v_dob, v_season) when 'U12' then v_t_u12 when 'U14' then v_t_u14 when 'U16' then v_t_u16 else null end, v_player, 'player'
      where public.age_group_for(v_dob, v_season) in ('U12', 'U14', 'U16');
    end if;
  end loop;

  -- one obvious duplicate for the duplicate detection to find
  insert into public.people (club_id, kind, first_name, last_name, dob, gender, school)
  select club_id, kind, first_name, last_name, dob, gender, school from public.people where club_id = v_club and kind = 'player' and first_name = 'Zara' limit 1
  returning id into v_player;
  insert into public.registrations (club_id, season_id, form_template_id, form_version, player_person_id, uniform_size, source, status, possible_duplicate, submitted_at)
  values (v_club, v_season, v_form, 1, v_player, 'Youth M', 'public_form', 'new', true, now() - interval '2 hours');

  -- follow-ups and a notice
  insert into public.tasks (club_id, title, owner_user_id, due_on, status) values
    (v_club, 'Chase the owing fees before round 1', v_admin, current_date + 7, 'open'),
    (v_club, 'Order U12 uniforms', v_admin, current_date + 14, 'open'),
    (v_club, 'Confirm Jordan''s WWCC renewal', v_admin, current_date + 10, 'open');
  insert into public.notices (club_id, title, body, published_at, created_by) values
    (v_club, 'Season starts Friday 10 October', 'First training is 5pm at Demo Stadium. Bring a drink bottle and a reversible singlet if you have one.', now() - interval '3 days', v_admin);

  -- a few events so the schedule has something in it
  insert into public.events (club_id, season_id, team_id, kind, starts_at, ends_at, venue_id, opponent) values
    (v_club, v_season, v_t_u12, 'training', date_trunc('week', now()) + interval '4 days 17 hours', date_trunc('week', now()) + interval '4 days 18 hours', v_venue, null),
    (v_club, v_season, v_t_u12, 'game', date_trunc('week', now()) + interval '11 days 18 hours', date_trunc('week', now()) + interval '11 days 19 hours', v_venue, 'Sample City Suns'),
    (v_club, v_season, v_t_u14, 'training', date_trunc('week', now()) + interval '4 days 18 hours', date_trunc('week', now()) + interval '4 days 19 hours', v_venue, null),
    (v_club, v_season, null, 'other', date_trunc('week', now()) + interval '6 days 10 hours', null, v_venue, null);

  insert into public.audit_log (club_id, actor_user_id, action, detail) values (v_club, null, 'demo.seed', '{"note":"synthetic demo club"}');
end $$;
