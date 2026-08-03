-- Milestone 6 additions: profile version history, growth reviews, and
-- ideas tagged to narrative arcs. Idempotent; run once in the SQL editor.

create table if not exists pp_profile_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  version int not null,
  profile jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists pp_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  summary text not null default '',
  moves jsonb not null default '[]',
  created_at timestamptz not null default now()
);

alter table pp_ideas add column if not exists narrative text;

alter table pp_profile_versions enable row level security;
alter table pp_reviews enable row level security;

drop policy if exists pp_profile_versions_read_own on pp_profile_versions;
create policy pp_profile_versions_read_own on pp_profile_versions for select using (auth.uid() = user_id);
drop policy if exists pp_reviews_read_own on pp_reviews;
create policy pp_reviews_read_own on pp_reviews for select using (auth.uid() = user_id);

create index if not exists pp_profile_versions_user on pp_profile_versions(user_id);
create index if not exists pp_reviews_user on pp_reviews(user_id);
