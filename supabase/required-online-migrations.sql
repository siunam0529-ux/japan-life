-- Safe online migrations for existing Japan Life Supabase projects.
-- Run this after the main schema files if the project was created before the
-- latest community / message updates. It is intentionally idempotent.

create extension if not exists pgcrypto;

-- Community post fields used by the current app.
alter table if exists public.community_posts add column if not exists favorite_count integer not null default 0;
alter table if exists public.community_posts add column if not exists view_count integer not null default 0;
alter table if exists public.community_posts add column if not exists report_count integer not null default 0;
alter table if exists public.community_posts add column if not exists is_solved boolean not null default false;
alter table if exists public.community_posts add column if not exists is_featured boolean not null default false;
alter table if exists public.community_posts add column if not exists is_pinned boolean not null default false;
alter table if exists public.community_posts add column if not exists is_official_recommended boolean not null default false;
alter table if exists public.community_posts add column if not exists featured_reason text;
alter table if exists public.community_posts add column if not exists pinned_until timestamptz;

create index if not exists community_posts_featured_idx on public.community_posts (is_featured);
create index if not exists community_posts_pinned_idx on public.community_posts (is_pinned);
create index if not exists community_posts_official_recommended_idx on public.community_posts (is_official_recommended);

-- Comment fields used by nested replies, likes, reports, and current inserts.
alter table if exists public.community_comments add column if not exists parent_id uuid;
alter table if exists public.community_comments add column if not exists community_locale text not null default 'zh-cn';
alter table if exists public.community_comments add column if not exists like_count integer not null default 0;
alter table if exists public.community_comments add column if not exists report_count integer not null default 0;
alter table if exists public.community_comments add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if to_regclass('public.community_comments') is not null
    and not exists (
      select 1 from pg_constraint
      where conname = 'community_comments_parent_id_fkey'
        and conrelid = 'public.community_comments'::regclass
    )
  then
    alter table public.community_comments
      add constraint community_comments_parent_id_fkey
      foreign key (parent_id) references public.community_comments(id) on delete cascade;
  end if;
end $$;

create index if not exists community_comments_parent_id_idx on public.community_comments (parent_id);
create index if not exists community_comments_created_at_idx on public.community_comments (created_at);

-- Reaction tables used by like/favorite buttons.
create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.community_favorites (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table if not exists public.community_comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.community_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

create index if not exists community_likes_user_id_idx on public.community_likes (user_id);
create index if not exists community_likes_post_id_idx on public.community_likes (post_id);
create index if not exists community_favorites_user_id_idx on public.community_favorites (user_id);
create index if not exists community_favorites_post_id_idx on public.community_favorites (post_id);
create index if not exists community_comment_likes_user_id_idx on public.community_comment_likes (user_id);
create index if not exists community_comment_likes_comment_id_idx on public.community_comment_likes (comment_id);

alter table public.community_likes enable row level security;
alter table public.community_favorites enable row level security;
alter table public.community_comment_likes enable row level security;

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

drop policy if exists "community comment likes read own" on public.community_comment_likes;
create policy "community comment likes read own"
on public.community_comment_likes for select
using (auth.uid() = user_id);

drop policy if exists "community comment likes insert own" on public.community_comment_likes;
create policy "community comment likes insert own"
on public.community_comment_likes for insert
with check (auth.uid() = user_id);

drop policy if exists "community comment likes delete own" on public.community_comment_likes;
create policy "community comment likes delete own"
on public.community_comment_likes for delete
using (auth.uid() = user_id);
