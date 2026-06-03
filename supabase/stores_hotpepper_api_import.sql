alter table public.friendly_shops
  add column if not exists source_type text default 'japan_life',
  add column if not exists hotpepper_url text,
  add column if not exists affiliate_url text,
  add column if not exists hotpepper_shop_id text,
  add column if not exists is_verified boolean default false,
  add column if not exists review_status text default 'pending',
  add column if not exists admin_note text,
  add column if not exists contact_type text,
  add column if not exists contact_value text,
  add column if not exists description_zh text,
  add column if not exists image_url text,
  add column if not exists budget text,
  add column if not exists station text,
  add column if not exists area text,
  add column if not exists middle_area_code text,
  add column if not exists middle_area_name text,
  add column if not exists small_area_code text,
  add column if not exists small_area_name text,
  add column if not exists address text,
  add column if not exists open_time text,
  add column if not exists close_time text,
  add column if not exists closed_days text;

create index if not exists friendly_shops_hotpepper_shop_id_idx
  on public.friendly_shops(hotpepper_shop_id)
  where hotpepper_shop_id is not null and hotpepper_shop_id <> '';

create index if not exists friendly_shops_source_type_idx
  on public.friendly_shops(source_type);

create index if not exists friendly_shops_review_status_idx
  on public.friendly_shops(review_status);

create index if not exists friendly_shops_middle_area_code_idx
  on public.friendly_shops(middle_area_code)
  where middle_area_code is not null and middle_area_code <> '';

create index if not exists friendly_shops_small_area_code_idx
  on public.friendly_shops(small_area_code)
  where small_area_code is not null and small_area_code <> '';
