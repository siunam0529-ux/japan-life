-- Japan Life Supabase setup
-- Run this in Supabase SQL Editor before production deploy.

create extension if not exists pgcrypto;

create table if not exists public.recommended_apps (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  image_url text not null default '',
  app_url text not null default '',
  category text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promotion_links (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  image_url text not null default '',
  link_url text not null default '',
  coupon_code text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.friendly_shops (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  description text not null default '',
  image_url text not null default '',
  address text not null default '',
  area text not null default '',
  category text not null default '',
  phone text not null default '',
  website_url text not null default '',
  map_url text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.friendly_shops
add column if not exists map_url text not null default '';

create table if not exists public.user_app_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recommended_apps_updated_at on public.recommended_apps;
create trigger set_recommended_apps_updated_at
before update on public.recommended_apps
for each row execute function public.set_updated_at();

drop trigger if exists set_promotion_links_updated_at on public.promotion_links;
create trigger set_promotion_links_updated_at
before update on public.promotion_links
for each row execute function public.set_updated_at();

drop trigger if exists set_friendly_shops_updated_at on public.friendly_shops;
create trigger set_friendly_shops_updated_at
before update on public.friendly_shops
for each row execute function public.set_updated_at();

alter table public.recommended_apps enable row level security;
alter table public.promotion_links enable row level security;
alter table public.friendly_shops enable row level security;
alter table public.user_app_data enable row level security;

drop policy if exists "Public can read published recommended apps" on public.recommended_apps;
create policy "Public can read published recommended apps"
on public.recommended_apps
for select
using (status = 'published');

drop policy if exists "Public can read published promotion links" on public.promotion_links;
create policy "Public can read published promotion links"
on public.promotion_links
for select
using (status = 'published');

drop policy if exists "Public can read published friendly shops" on public.friendly_shops;
create policy "Public can read published friendly shops"
on public.friendly_shops
for select
using (status = 'published');

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'public-images',
  'public-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read public images" on storage.objects;
create policy "Public can read public images"
on storage.objects
for select
using (bucket_id = 'public-images');

-- Uploads are performed by Next.js API routes with SUPABASE_SERVICE_ROLE_KEY.
-- Do not expose the service role key to the browser.
