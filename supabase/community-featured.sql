alter table community_posts add column if not exists is_featured boolean default false;
alter table community_posts add column if not exists is_pinned boolean default false;
alter table community_posts add column if not exists is_official_recommended boolean default false;
alter table community_posts add column if not exists featured_reason text;
alter table community_posts add column if not exists pinned_until timestamptz;

create index if not exists community_posts_featured_idx on community_posts (is_featured);
create index if not exists community_posts_pinned_idx on community_posts (is_pinned);
create index if not exists community_posts_official_recommended_idx on community_posts (is_official_recommended);
