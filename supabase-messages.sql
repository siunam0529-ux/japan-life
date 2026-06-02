create extension if not exists pgcrypto;

alter table public.community_profiles add column if not exists user_id text;
alter table public.community_profiles add column if not exists public_id text;
alter table public.community_profiles add column if not exists display_name text;
alter table public.community_profiles add column if not exists avatar text;
alter table public.community_profiles add column if not exists bio text;
alter table public.community_profiles add column if not exists area text;
alter table public.community_profiles add column if not exists languages text[] not null default '{}';
alter table public.community_profiles add column if not exists interests text[] not null default '{}';
alter table public.community_profiles add column if not exists is_anonymous_default boolean not null default false;

update public.community_profiles
set user_id = coalesce(user_id, id::text)
where user_id is null;

update public.community_profiles
set public_id = coalesce(nullif(public_id, ''), 'jl-' || left(coalesce(user_id, id::text), 8))
where public_id is null or public_id = '';

create unique index if not exists community_profiles_user_id_unique on public.community_profiles(user_id);
create unique index if not exists community_profiles_public_id_unique on public.community_profiles(public_id);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  participant_a_id text not null,
  participant_b_id text not null,
  last_message text not null default '',
  last_message_at timestamptz not null default now(),
  last_message_sender_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversations_distinct_participants check (participant_a_id <> participant_b_id),
  constraint conversations_unique_participants unique (participant_a_id, participant_b_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id text not null,
  receiver_id text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_not_empty check (length(trim(body)) > 0),
  constraint messages_distinct_participants check (sender_id <> receiver_id)
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id text not null,
  blocked_id text not null,
  created_at timestamptz not null default now(),
  constraint user_blocks_distinct_users check (blocker_id <> blocked_id),
  constraint user_blocks_unique_pair unique (blocker_id, blocked_id)
);

create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  reporter_id text not null,
  reported_user_id text not null,
  reason text not null check (reason in ('harassment','spam','inappropriate','other')),
  detail text,
  status text not null default 'open' check (status in ('open','reviewing','resolved','ignored')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists conversations_participant_a_idx on public.conversations(participant_a_id);
create index if not exists conversations_participant_b_idx on public.conversations(participant_b_id);
create index if not exists conversations_last_message_at_idx on public.conversations(last_message_at desc);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create index if not exists messages_receiver_unread_idx on public.messages(receiver_id, read_at);
create index if not exists user_blocks_blocker_idx on public.user_blocks(blocker_id);
create index if not exists user_blocks_blocked_idx on public.user_blocks(blocked_id);
create index if not exists message_reports_reporter_idx on public.message_reports(reporter_id);
create index if not exists message_reports_reported_user_idx on public.message_reports(reported_user_id);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;
alter table public.message_reports enable row level security;

drop policy if exists "conversation participants read" on public.conversations;
create policy "conversation participants read"
on public.conversations for select
using (auth.uid()::text = participant_a_id or auth.uid()::text = participant_b_id);

drop policy if exists "conversation participants insert" on public.conversations;
create policy "conversation participants insert"
on public.conversations for insert
with check (auth.uid()::text = participant_a_id or auth.uid()::text = participant_b_id);

drop policy if exists "conversation participants update" on public.conversations;
create policy "conversation participants update"
on public.conversations for update
using (auth.uid()::text = participant_a_id or auth.uid()::text = participant_b_id)
with check (auth.uid()::text = participant_a_id or auth.uid()::text = participant_b_id);

drop policy if exists "message participants read" on public.messages;
create policy "message participants read"
on public.messages for select
using (auth.uid()::text = sender_id or auth.uid()::text = receiver_id);

drop policy if exists "message sender insert" on public.messages;
create policy "message sender insert"
on public.messages for insert
with check (auth.uid()::text = sender_id);

drop policy if exists "message receiver update read" on public.messages;
create policy "message receiver update read"
on public.messages for update
using (auth.uid()::text = receiver_id)
with check (auth.uid()::text = receiver_id);

drop policy if exists "blocks involved users read" on public.user_blocks;
create policy "blocks involved users read"
on public.user_blocks for select
using (auth.uid()::text = blocker_id or auth.uid()::text = blocked_id);

drop policy if exists "blocks owner insert" on public.user_blocks;
create policy "blocks owner insert"
on public.user_blocks for insert
with check (auth.uid()::text = blocker_id);

drop policy if exists "blocks owner delete" on public.user_blocks;
create policy "blocks owner delete"
on public.user_blocks for delete
using (auth.uid()::text = blocker_id);

drop policy if exists "message reports owner insert" on public.message_reports;
create policy "message reports owner insert"
on public.message_reports for insert
with check (auth.uid()::text = reporter_id);

drop policy if exists "message reports owner read" on public.message_reports;
create policy "message reports owner read"
on public.message_reports for select
using (auth.uid()::text = reporter_id);
