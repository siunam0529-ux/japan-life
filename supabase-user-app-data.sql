-- Legacy minimal setup for user cloud sync only.
-- For the full Japan Life CMS, Storage bucket, RLS and user sync setup,
-- use supabase-schema.sql instead.

create table if not exists public.user_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_app_data enable row level security;

drop policy if exists "Users can read their own app data" on public.user_app_data;
create policy "Users can read their own app data"
on public.user_app_data
for select
using (auth.uid() = user_id);

drop policy if exists "Users can write their own app data" on public.user_app_data;
create policy "Users can write their own app data"
on public.user_app_data
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
