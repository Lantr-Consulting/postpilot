-- Milestone 7: async runs. The partial unique index IS the per-user run
-- lock — the insert is the claim, and Postgres arbitrates across workers
-- (an in-memory lock dies with 2 uvicorn workers). Idempotent.

create table if not exists pp_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,               -- research | ingestion | repurpose | review
  status text not null default 'queued',  -- queued | running | done | failed
  progress text not null default '',
  steer text[] not null default '{}',
  report text,
  material_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists pp_runs_one_live
  on pp_runs(user_id) where status in ('queued', 'running');

alter table pp_runs enable row level security;
drop policy if exists pp_runs_read_own on pp_runs;
create policy pp_runs_read_own on pp_runs for select using (auth.uid() = user_id);

create index if not exists pp_runs_user on pp_runs(user_id);
