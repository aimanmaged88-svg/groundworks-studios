-- Families see their coach's profile (name, role, specialty, bio…)
-- without opening the coaches table itself (phone/email/WWCC stay staff-only).
create or replace view coach_public as
  select id, name, role, profile from coaches;
grant select on coach_public to authenticated;
