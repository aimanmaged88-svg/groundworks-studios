-- Storage buckets. Object paths are "<club_id>/<file>", so the first folder is
-- the club and the table policies can be mirrored.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('club-logos', 'club-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('club-media', 'club-media', true, 8388608, array['image/png', 'image/jpeg', 'image/webp']),
  ('documents', 'documents', false, 10485760, null)
on conflict (id) do nothing;

create or replace function app.club_of_object(p_name text)
returns uuid language sql immutable set search_path = '' as $$
  select case when split_part(p_name, '/', 1) ~ '^[0-9a-f-]{36}$' then split_part(p_name, '/', 1)::uuid end;
$$;

create policy "public buckets are readable" on storage.objects for select to anon, authenticated
  using (bucket_id in ('club-logos', 'club-media'));

create policy "club admins manage logos and media" on storage.objects for insert to authenticated
  with check (bucket_id in ('club-logos', 'club-media') and app.is_admin(app.club_of_object(name)));
create policy "club admins update logos and media" on storage.objects for update to authenticated
  using (bucket_id in ('club-logos', 'club-media') and app.is_admin(app.club_of_object(name)));
create policy "club admins delete logos and media" on storage.objects for delete to authenticated
  using (bucket_id in ('club-logos', 'club-media') and app.is_admin(app.club_of_object(name)));

create policy "members read documents" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and app.is_member(app.club_of_object(name)));
create policy "admins write documents" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and app.is_admin(app.club_of_object(name)));
create policy "admins delete documents" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and app.is_admin(app.club_of_object(name)));
