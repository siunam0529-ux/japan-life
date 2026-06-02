-- Japan Life community tables.
-- Run this file in the Supabase SQL Editor after the core auth project is ready.

create extension if not exists pgcrypto;

create or replace function public.set_community_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.increment_community_post_counter(
  target_post_id uuid,
  counter_name text,
  delta integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  if counter_name = 'like_count' then
    update public.community_posts
    set like_count = greatest(0, like_count + delta), updated_at = now()
    where id = target_post_id
    returning like_count into next_count;
  elsif counter_name = 'favorite_count' then
    update public.community_posts
    set favorite_count = greatest(0, favorite_count + delta), updated_at = now()
    where id = target_post_id
    returning favorite_count into next_count;
  elsif counter_name = 'comment_count' then
    update public.community_posts
    set comment_count = greatest(0, comment_count + delta), updated_at = now()
    where id = target_post_id
    returning comment_count into next_count;
  elsif counter_name = 'view_count' then
    update public.community_posts
    set view_count = greatest(0, view_count + delta)
    where id = target_post_id
    returning view_count into next_count;
  else
    raise exception 'Unsupported community post counter: %', counter_name;
  end if;

  return coalesce(next_count, 0);
end;
$$;

create or replace function public.increment_community_report_counter(
  target_kind text,
  target_record_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  next_count integer;
begin
  if target_kind = 'post' then
    update public.community_posts
    set
      report_count = report_count + 1,
      status = case when report_count + 1 >= 3 then 'reported' else status end,
      updated_at = now()
    where id = target_record_id
    returning report_count into next_count;
  elsif target_kind = 'comment' then
    update public.community_comments
    set
      report_count = report_count + 1,
      status = case when report_count + 1 >= 3 then 'reported' else status end,
      updated_at = now()
    where id = target_record_id
    returning report_count into next_count;
  else
    next_count := 1;
  end if;

  return coalesce(next_count, 0);
end;
$$;

grant execute on function public.increment_community_post_counter(uuid, text, integer) to authenticated;
grant execute on function public.increment_community_report_counter(text, uuid) to authenticated;

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  community_locale text not null check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  type text not null check (type in ('share', 'help', 'secondhand', 'buddy', 'helper')),
  title text not null,
  content text not null,
  area text not null,
  author_name text,
  is_anonymous boolean not null default false,
  images jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('pending', 'published', 'reported', 'hidden', 'deleted')),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  favorite_count integer not null default 0,
  view_count integer not null default 0,
  report_count integer not null default 0,
  is_solved boolean not null default false,
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  is_official_recommended boolean not null default false,
  featured_reason text,
  pinned_until timestamptz,
  price text,
  item_status text,
  condition text,
  pickup_method text,
  buddy_type text,
  people text,
  budget text,
  helper_category text,
  help_category text,
  share_category text,
  time text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts
  add column if not exists view_count integer not null default 0;

create index if not exists community_posts_locale_idx on public.community_posts (community_locale);
create index if not exists community_posts_type_idx on public.community_posts (type);
create index if not exists community_posts_status_idx on public.community_posts (status);
create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_tags_idx on public.community_posts using gin (tags);
create index if not exists community_posts_user_id_idx on public.community_posts (user_id);
create index if not exists community_posts_featured_idx on public.community_posts (is_featured);
create index if not exists community_posts_pinned_idx on public.community_posts (is_pinned);
create index if not exists community_posts_official_recommended_idx on public.community_posts (is_official_recommended);

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
before update on public.community_posts
for each row execute function public.set_community_updated_at();

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  community_locale text not null check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  author_name text,
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'reported', 'hidden', 'deleted')),
  like_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_comments_post_id_idx on public.community_comments (post_id);
create index if not exists community_comments_user_id_idx on public.community_comments (user_id);
create index if not exists community_comments_parent_id_idx on public.community_comments (parent_id);
create index if not exists community_comments_status_idx on public.community_comments (status);
create index if not exists community_comments_created_at_idx on public.community_comments (created_at);

drop trigger if exists set_community_comments_updated_at on public.community_comments;
create trigger set_community_comments_updated_at
before update on public.community_comments
for each row execute function public.set_community_updated_at();

create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists community_likes_user_id_idx on public.community_likes (user_id);
create index if not exists community_likes_post_id_idx on public.community_likes (post_id);

create table if not exists public.community_favorites (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create index if not exists community_favorites_user_id_idx on public.community_favorites (user_id);
create index if not exists community_favorites_post_id_idx on public.community_favorites (post_id);



create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'ignored')),
  created_at timestamptz not null default now()
);

create index if not exists community_reports_target_type_idx on public.community_reports (target_type);
create index if not exists community_reports_target_id_idx on public.community_reports (target_id);
create index if not exists community_reports_status_idx on public.community_reports (status);
create index if not exists community_reports_created_at_idx on public.community_reports (created_at);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  target_type text,
  target_id uuid,
  post_id uuid,
  community_locale text check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists community_notifications_user_id_idx on public.community_notifications (user_id);
create index if not exists community_notifications_is_read_idx on public.community_notifications (is_read);
create index if not exists community_notifications_created_at_idx on public.community_notifications (created_at);

create table if not exists public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar text,
  bio text,
  area text,
  languages text[] not null default '{}',
  interests text[] not null default '{}',
  is_anonymous_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_community_profiles_updated_at on public.community_profiles;
create trigger set_community_profiles_updated_at
before update on public.community_profiles
for each row execute function public.set_community_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_favorites enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_notifications enable row level security;
alter table public.community_profiles enable row level security;

drop policy if exists "community posts published are readable" on public.community_posts;
create policy "community posts published are readable"
on public.community_posts for select
using (status = 'published' or auth.uid() = user_id);

drop policy if exists "community posts insert own" on public.community_posts;
create policy "community posts insert own"
on public.community_posts for insert
with check (auth.uid() = user_id and status in ('pending', 'published'));

drop policy if exists "community posts update own" on public.community_posts;
create policy "community posts update own"
on public.community_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community posts delete own" on public.community_posts;
create policy "community posts delete own"
on public.community_posts for delete
using (auth.uid() = user_id);

drop policy if exists "community comments published are readable" on public.community_comments;
create policy "community comments published are readable"
on public.community_comments for select
using (status = 'published' or auth.uid() = user_id);

drop policy if exists "community comments insert own" on public.community_comments;
create policy "community comments insert own"
on public.community_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "community comments update own" on public.community_comments;
create policy "community comments update own"
on public.community_comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community comments delete own" on public.community_comments;
create policy "community comments delete own"
on public.community_comments for delete
using (auth.uid() = user_id);

drop policy if exists "community likes read own" on public.community_likes;
create policy "community likes read own"
on public.community_likes for select
using (auth.uid() = user_id);

drop policy if exists "community likes insert own" on public.community_likes;
create policy "community likes insert own"
on public.community_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "community likes delete own" on public.community_likes;
create policy "community likes delete own"
on public.community_likes for delete
using (auth.uid() = user_id);

drop policy if exists "community favorites read own" on public.community_favorites;
create policy "community favorites read own"
on public.community_favorites for select
using (auth.uid() = user_id);

drop policy if exists "community favorites insert own" on public.community_favorites;
create policy "community favorites insert own"
on public.community_favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "community favorites delete own" on public.community_favorites;
create policy "community favorites delete own"
on public.community_favorites for delete
using (auth.uid() = user_id);



drop policy if exists "community reports insert own" on public.community_reports;
create policy "community reports insert own"
on public.community_reports for insert
with check (auth.uid() = user_id);

drop policy if exists "community reports read own" on public.community_reports;
create policy "community reports read own"
on public.community_reports for select
using (auth.uid() = user_id);

drop policy if exists "community notifications read own" on public.community_notifications;
create policy "community notifications read own"
on public.community_notifications for select
using (auth.uid() = user_id);

drop policy if exists "community notifications update own" on public.community_notifications;
create policy "community notifications update own"
on public.community_notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "community notifications insert authenticated" on public.community_notifications;
create policy "community notifications insert authenticated"
on public.community_notifications for insert
with check (auth.uid() is not null);

drop policy if exists "community profiles readable" on public.community_profiles;
create policy "community profiles readable"
on public.community_profiles for select
using (true);

drop policy if exists "community profiles insert own" on public.community_profiles;
create policy "community profiles insert own"
on public.community_profiles for insert
with check (auth.uid() = id);

drop policy if exists "community profiles update own" on public.community_profiles;
create policy "community profiles update own"
on public.community_profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Admin moderation should use the existing admin-password API routes with the
-- service role key. Do not expose the service role key to browser code.
