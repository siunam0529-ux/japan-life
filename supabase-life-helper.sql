create extension if not exists pgcrypto;

create table if not exists public.life_helper_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  area text not null,
  budget text not null default '',
  preferred_time text not null default '',
  description text not null default '',
  contact text not null default '',
  contact_visibility text not null default 'after_apply',
  author_id uuid not null references auth.users(id) on delete cascade,
  author_name text not null default 'Japan Life 用户',
  status text not null default 'open',
  source text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_helper_requests_category_check check (category in ('cleaning','moving','pet','errand','procedure','translate','furniture','hospital','other')),
  constraint life_helper_requests_contact_visibility_check check (contact_visibility in ('after_apply','public','private')),
  constraint life_helper_requests_status_check check (status in ('open','closed'))
);

create table if not exists public.life_helper_applications (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.life_helper_requests(id) on delete cascade,
  applicant_id uuid not null references auth.users(id) on delete cascade,
  applicant_name text not null default 'Japan Life 用户',
  message text not null,
  contact text not null,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_helper_applications_status_check check (status in ('sent','accepted','declined')),
  constraint life_helper_applications_unique_user unique (request_id, applicant_id)
);

create table if not exists public.life_helper_business_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null,
  category text not null,
  area text not null,
  contact_name text not null,
  phone text not null default '',
  email text not null default '',
  line_id text not null default '',
  website text not null default '',
  description text not null,
  price_info text not null default '',
  business_hours text not null default '',
  languages text[] not null default '{}',
  service_language_tag text not null default '中日双语',
  notes text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_helper_business_status_check check (status in ('pending','approved','rejected'))
);

create table if not exists public.life_helper_personal_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  services text[] not null default '{}',
  area text not null,
  available_time text not null default '',
  contact text not null,
  contact_type text not null default 'LINE',
  languages text[] not null default '{}',
  service_language_tag text not null default '中日双语',
  experience text not null default '',
  price_expectation text not null default '',
  self_intro text not null,
  notes text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint life_helper_personal_status_check check (status in ('pending','approved','rejected'))
);

create index if not exists life_helper_requests_status_created_idx on public.life_helper_requests(status, created_at desc);
create index if not exists life_helper_requests_author_idx on public.life_helper_requests(author_id, created_at desc);
create index if not exists life_helper_applications_request_idx on public.life_helper_applications(request_id, created_at desc);
create index if not exists life_helper_applications_applicant_idx on public.life_helper_applications(applicant_id, created_at desc);
create index if not exists life_helper_business_status_idx on public.life_helper_business_applications(status, created_at desc);
create index if not exists life_helper_personal_status_idx on public.life_helper_personal_applications(status, created_at desc);

alter table public.life_helper_requests enable row level security;
alter table public.life_helper_applications enable row level security;
alter table public.life_helper_business_applications enable row level security;
alter table public.life_helper_personal_applications enable row level security;
