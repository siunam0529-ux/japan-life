-- Japan Life benefits setup
-- Run this in Supabase SQL Editor after supabase-schema.sql.

create extension if not exists pgcrypto;

create table if not exists public.benefits (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  source_url text not null unique,
  source_name text,
  area text,
  ward text,
  category text,
  target_people text,
  deadline text,
  apply_url text,
  translated_title text,
  translated_summary text,
  translation_provider text default 'original',
  translation_error text,
  translated_at timestamptz,
  status text default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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

drop trigger if exists set_benefits_updated_at on public.benefits;
create trigger set_benefits_updated_at
before update on public.benefits
for each row execute function public.set_updated_at();

alter table public.benefits enable row level security;

drop policy if exists "Public can read published benefits" on public.benefits;
create policy "Public can read published benefits"
on public.benefits
for select
using (status = 'published');

create index if not exists benefits_status_created_at_idx
on public.benefits (status, created_at desc);

create index if not exists benefits_area_idx
on public.benefits (area);

create index if not exists benefits_ward_idx
on public.benefits (ward);

create index if not exists benefits_category_idx
on public.benefits (category);

alter table public.benefits add column if not exists translated_title text;
alter table public.benefits add column if not exists translated_summary text;
alter table public.benefits add column if not exists translation_provider text default 'original';
alter table public.benefits add column if not exists translation_error text;
alter table public.benefits add column if not exists translated_at timestamptz;
