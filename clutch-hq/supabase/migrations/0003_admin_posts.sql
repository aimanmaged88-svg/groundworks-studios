-- The status column's default ('pending') is already on NEW when the trigger runs,
-- so coalesce never saw a null. Admin content is simply approved on the spot.
create or replace function stamp_post() returns trigger
language plpgsql security definer set search_path = public as $$
declare p profiles;
begin
  select * into p from profiles where id = auth.uid();
  new.author_id := auth.uid();
  new.author_name := coalesce(p.full_name, '');
  new.author_role := coalesce(p.role, 'pending');
  if p.role = 'admin' then
    new.status := 'approved'; new.reviewed_by := auth.uid(); new.reviewed_at := now();
  else
    new.status := 'pending'; new.reviewed_by := null; new.reviewed_at := null;
  end if;
  return new;
end $$;
