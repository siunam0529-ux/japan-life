-- Japan Life community schema preparation.
-- Run this file manually in the Supabase SQL Editor.
-- Do not place a service role key in frontend code.

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

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  community_locale text not null check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  type text not null check (type in ('share', 'help', 'secondhand', 'buddy', 'helper')),
  title text not null,
  content text not null,
  area text,
  images jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'pending', 'reported', 'hidden', 'deleted')),
  price text,
  item_status text,
  condition text,
  pickup_method text,
  buddy_type text,
  time text,
  people text,
  budget text,
  helper_category text,
  help_category text,
  share_category text,
  is_solved boolean not null default false,
  like_count integer not null default 0,
  comment_count integer not null default 0,
  favorite_count integer not null default 0,
  view_count integer not null default 0,
  report_count integer not null default 0,
  is_featured boolean not null default false,
  is_pinned boolean not null default false,
  is_official_recommended boolean not null default false,
  featured_reason text,
  pinned_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts
  add column if not exists view_count integer not null default 0;

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  author_name text,
  parent_id uuid null references public.community_comments(id) on delete cascade,
  community_locale text not null default 'zh-cn' check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  content text not null,
  is_anonymous boolean not null default false,
  status text not null default 'published' check (status in ('published', 'reported', 'hidden', 'deleted')),
  like_count integer not null default 0,
  report_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.community_favorites (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.community_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  user_id text not null,
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);


create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id text not null,
  user_id text,
  reason text not null,
  detail text,
  status text not null default 'pending' check (status in ('pending', 'resolved', 'ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  type text not null check (type in ('comment', 'reply', 'like', 'favorite', 'report_result', 'post_approved', 'post_hidden', 'system')),
  title text not null,
  message text not null,
  target_type text,
  target_id text,
  post_id text,
  community_locale text check (community_locale in ('zh-cn', 'zh-tw', 'ja')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar text,
  bio text,
  area text,
  languages jsonb not null default '[]'::jsonb,
  interests jsonb not null default '[]'::jsonb,
  is_anonymous_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_locale_idx on public.community_posts (community_locale);
create index if not exists community_posts_status_idx on public.community_posts (status);
create index if not exists community_posts_type_idx on public.community_posts (type);
create index if not exists community_posts_created_at_idx on public.community_posts (created_at desc);
create index if not exists community_posts_tags_idx on public.community_posts using gin (tags);
create index if not exists community_posts_user_id_idx on public.community_posts (user_id);
create index if not exists community_comments_post_id_idx on public.community_comments (post_id);
create index if not exists community_comments_status_idx on public.community_comments (status);
create index if not exists community_likes_user_id_idx on public.community_likes (user_id);
create index if not exists community_favorites_user_id_idx on public.community_favorites (user_id);
create index if not exists community_comment_likes_user_id_idx on public.community_comment_likes (user_id);
create index if not exists community_comment_likes_comment_id_idx on public.community_comment_likes (comment_id);
create index if not exists community_reports_target_idx on public.community_reports (target_type, target_id);
create index if not exists community_reports_status_idx on public.community_reports (status);
create index if not exists community_notifications_user_id_idx on public.community_notifications (user_id);
create index if not exists community_notifications_is_read_idx on public.community_notifications (is_read);

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
before update on public.community_posts
for each row execute function public.set_community_updated_at();

drop trigger if exists set_community_comments_updated_at on public.community_comments;
create trigger set_community_comments_updated_at
before update on public.community_comments
for each row execute function public.set_community_updated_at();


drop trigger if exists set_community_reports_updated_at on public.community_reports;
create trigger set_community_reports_updated_at
before update on public.community_reports
for each row execute function public.set_community_updated_at();

drop trigger if exists set_community_profiles_updated_at on public.community_profiles;
create trigger set_community_profiles_updated_at
before update on public.community_profiles
for each row execute function public.set_community_updated_at();

alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_favorites enable row level security;
alter table public.community_comment_likes enable row level security;
alter table public.community_reports enable row level security;
alter table public.community_notifications enable row level security;
alter table public.community_profiles enable row level security;

-- RLS v1 notes:
-- Public reads are intentionally limited to published content and public profiles.
-- Writes assume Supabase Auth for the first production pass.
-- During development only, you may temporarily disable RLS or loosen policies.
-- Before production, review every write policy and keep auth.uid() ownership checks.

drop policy if exists "community posts published are readable" on public.community_posts;
create policy "community posts published are readable"
on public.community_posts for select
using (status = 'published' or auth.uid() = user_id);

drop policy if exists "community posts insert own" on public.community_posts;
create policy "community posts insert own"
on public.community_posts for insert
with check (auth.uid() = user_id);

drop policy if exists "community posts update own" on public.community_posts;
create policy "community posts update own"
on public.community_posts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

drop policy if exists "community likes own rows" on public.community_likes;
create policy "community likes own rows"
on public.community_likes for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "community favorites own rows" on public.community_favorites;
create policy "community favorites own rows"
on public.community_favorites for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

drop policy if exists "community comment likes own rows" on public.community_comment_likes;
create policy "community comment likes own rows"
on public.community_comment_likes for all
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);



drop policy if exists "community reports insert own" on public.community_reports;
create policy "community reports insert own"
on public.community_reports for insert
with check (auth.uid() is not null and (user_id is null or auth.uid()::text = user_id));

drop policy if exists "community reports read own" on public.community_reports;
create policy "community reports read own"
on public.community_reports for select
using (auth.uid()::text = user_id);

drop policy if exists "community notifications read own" on public.community_notifications;
create policy "community notifications read own"
on public.community_notifications for select
using (auth.uid()::text = user_id);

drop policy if exists "community notifications update own" on public.community_notifications;
create policy "community notifications update own"
on public.community_notifications for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

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

grant execute on function public.increment_community_post_counter(uuid, text, integer) to authenticated;
grant execute on function public.increment_community_report_counter(text, uuid) to authenticated;

-- Admin moderation should continue to use server-side admin routes/service role.
-- Never expose SUPABASE_SERVICE_ROLE_KEY to browser code.
