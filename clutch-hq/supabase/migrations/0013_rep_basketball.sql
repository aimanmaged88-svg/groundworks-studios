-- Rep basketball tracking on players:
--   plays_reps  — currently plays representative basketball
--   rep_tryout  — has tried out for reps before
--   rep_note    — free text: association, team, year
alter table players
  add column if not exists plays_reps boolean not null default false,
  add column if not exists rep_tryout boolean not null default false,
  add column if not exists rep_note text not null default '';
