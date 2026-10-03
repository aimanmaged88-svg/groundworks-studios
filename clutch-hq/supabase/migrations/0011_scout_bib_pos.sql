-- Tryout board: optional bib/singlet number and position on each standout,
-- and the coach's name becomes required server-side (attribution matters).
-- The old 8-argument scout_add overload remains; clients call this one.
alter table scout_notes add column bib text not null default '';
alter table scout_notes add column pos text not null default '';

create or replace function scout_add(p_key text, p_grp text, p_player text, p_look text, p_note text, p_rating int, p_coach text, p_device text, p_bib text, p_pos text)
returns uuid language plpgsql security definer set search_path = public as $$
declare rid uuid;
begin
  if not scout_key_ok(p_key) then raise exception 'bad key'; end if;
  if not scout_open() then raise exception 'The board is closed — tryouts are done.'; end if;
  if (select count(*) from scout_notes) >= 800 then raise exception 'Board is full'; end if;
  if length(trim(p_player)) < 1 then raise exception 'Who stood out?'; end if;
  if length(trim(p_coach)) < 1 then raise exception 'Put your name in first, coach'; end if;
  insert into scout_notes (grp, player, look, note, rating, coach, device, bib, pos)
  values (left(trim(p_grp), 10), left(trim(p_player), 80), left(trim(p_look), 120),
          left(trim(p_note), 300), greatest(1, least(3, p_rating)), left(trim(p_coach), 40), left(p_device, 40),
          left(trim(p_bib), 6), left(trim(p_pos), 10))
  returning id into rid;
  return rid;
end $$;
grant execute on function scout_add(text, text, text, text, text, int, text, text, text, text) to anon, authenticated;
