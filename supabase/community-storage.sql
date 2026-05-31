-- Japan Life community image storage.
-- Create the Storage bucket in Supabase Dashboard first:
-- bucket name: community-images
-- public bucket: true

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "community images are public" on storage.objects;
create policy "community images are public"
on storage.objects for select
using (bucket_id = 'community-images');

drop policy if exists "users upload own community images" on storage.objects;
create policy "users upload own community images"
on storage.objects for insert
with check (
  bucket_id = 'community-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users update own community images" on storage.objects;
create policy "users update own community images"
on storage.objects for update
using (
  bucket_id = 'community-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'community-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "users delete own community images" on storage.objects;
create policy "users delete own community images"
on storage.objects for delete
using (
  bucket_id = 'community-images'
  and auth.uid() is not null
  and (storage.foldername(name))[1] = 'community'
  and (storage.foldername(name))[2] = auth.uid()::text
);
