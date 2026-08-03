-- PostPilot schema — Milestone 5. Shares the sample-fleet Supabase project
-- (pp_-prefixed tables, like AirAware's aa_). Run once in the SQL editor.
-- RLS: users read only their own rows; ALL writes go through the backend
-- service key ("two people, two worlds").

create table if not exists pp_creators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  ip_profile jsonb not null,
  ip_version int not null default 1,
  editorial_rules jsonb not null,
  platforms text[] not null default '{x,linkedin,instagram,bluesky}',
  niche jsonb not null,
  activated boolean not null default false,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pp_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'notes',
  added_at date not null default current_date,
  words int not null default 0,
  status text not null default 'uploaded',
  atom_count int not null default 0,
  excerpt text not null default '',
  body text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists pp_atoms (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references pp_materials(id) on delete cascade,
  material_title text not null default '',
  kind text not null default 'take',
  body text not null,
  pillars text[] not null default '{}',
  narrative text,
  used_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists pp_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  angle text not null default '',
  pillar text not null default '',
  rationale text not null default '',
  evidence jsonb not null default '[]',
  status text not null default 'proposed',
  feedback jsonb,
  run_id text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists pp_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea_id uuid references pp_ideas(id) on delete set null,
  idea_title text not null default '',
  platform text not null,
  body text not null,
  hashtags text[] not null default '{}',
  sponsored boolean not null default false,
  atom_ids text[] not null default '{}',
  checks jsonb not null default '[]',
  status text not null default 'draft',
  slot_date date,
  feedback jsonb,
  created_at timestamptz not null default now()
);

create table if not exists pp_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  draft_id uuid references pp_drafts(id) on delete set null,
  title text not null default '',
  platform text not null default 'x',
  posted_at date not null default current_date,
  metrics jsonb not null default '{}',
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists pp_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New thread',
  updated_at timestamptz not null default now()
);

create table if not exists pp_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references pp_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists pp_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null default '',
  cadence text not null default 'manual',
  hour_local int not null default 8,
  enabled boolean not null default true,
  built_in boolean not null default false,
  last_run_at timestamptz,
  last_report text,
  created_at timestamptz not null default now()
);

-- RLS: read-own only. No insert/update/delete policies — the anon role
-- can't write; the backend's service key bypasses RLS by design.
alter table pp_creators enable row level security;
alter table pp_materials enable row level security;
alter table pp_atoms enable row level security;
alter table pp_ideas enable row level security;
alter table pp_drafts enable row level security;
alter table pp_results enable row level security;
alter table pp_threads enable row level security;
alter table pp_messages enable row level security;
alter table pp_campaigns enable row level security;

drop policy if exists pp_creators_read_own on pp_creators;
create policy pp_creators_read_own on pp_creators for select using (auth.uid() = user_id);
drop policy if exists pp_materials_read_own on pp_materials;
create policy pp_materials_read_own on pp_materials for select using (auth.uid() = user_id);
drop policy if exists pp_atoms_read_own on pp_atoms;
create policy pp_atoms_read_own on pp_atoms for select using (auth.uid() = user_id);
drop policy if exists pp_ideas_read_own on pp_ideas;
create policy pp_ideas_read_own on pp_ideas for select using (auth.uid() = user_id);
drop policy if exists pp_drafts_read_own on pp_drafts;
create policy pp_drafts_read_own on pp_drafts for select using (auth.uid() = user_id);
drop policy if exists pp_results_read_own on pp_results;
create policy pp_results_read_own on pp_results for select using (auth.uid() = user_id);
drop policy if exists pp_threads_read_own on pp_threads;
create policy pp_threads_read_own on pp_threads for select using (auth.uid() = user_id);
drop policy if exists pp_messages_read_own on pp_messages;
create policy pp_messages_read_own on pp_messages for select using (auth.uid() = user_id);
drop policy if exists pp_campaigns_read_own on pp_campaigns;
create policy pp_campaigns_read_own on pp_campaigns for select using (auth.uid() = user_id);

create index if not exists pp_materials_user on pp_materials(user_id);
create index if not exists pp_atoms_user on pp_atoms(user_id);
create index if not exists pp_ideas_user on pp_ideas(user_id);
create index if not exists pp_drafts_user on pp_drafts(user_id);
create index if not exists pp_results_user on pp_results(user_id);
create index if not exists pp_messages_thread on pp_messages(thread_id);
