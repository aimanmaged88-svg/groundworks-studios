-- Families can change exactly three things about their own player:
-- photo, social handles, and the player's mobile. Nothing else.
create or replace function set_player_profile(p_player uuid, p_photo text, p_socials jsonb, p_phone text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (is_admin() or player_in_my_family(p_player)) then raise exception 'not your player'; end if;
  update players set
    photo_path = coalesce(p_photo, photo_path),
    socials = coalesce(p_socials, socials),
    phone = coalesce(p_phone, phone)
  where id = p_player;
end $$;
revoke execute on function set_player_profile(uuid, text, jsonb, text) from public, anon;
