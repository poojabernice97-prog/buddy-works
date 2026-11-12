-- Buddy Phase 0: core portfolio memory tables in a dedicated schema.
-- OpenBot's application database remains separate; this schema is for Buddy's
-- Supabase-backed memory when wired in later phases.

create schema if not exists buddy;

create table buddy.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  goal text,
  focus_area text check (
    focus_area in (
      'initiating',
      'planning',
      'executing',
      'monitoring_controlling',
      'closing'
    )
  ),
  approach text check (approach in ('predictive', 'adaptive', 'hybrid')),
  milestones jsonb not null default '[]'::jsonb,
  baseline_dates jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buddy.raid_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references buddy.projects (id) on delete cascade,
  kind text not null check (kind in ('risk', 'assumption', 'issue', 'dependency')),
  title text not null,
  description text,
  status text not null default 'open',
  item_owner text,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buddy.decisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid not null references buddy.projects (id) on delete cascade,
  decision text not null,
  options_considered jsonb not null default '[]'::jsonb,
  reasoning text,
  assumptions jsonb not null default '[]'::jsonb,
  review_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index buddy_projects_owner_id_idx on buddy.projects (owner_id);
create index buddy_raid_items_owner_project_idx on buddy.raid_items (owner_id, project_id);
create index buddy_decisions_owner_project_idx on buddy.decisions (owner_id, project_id);

alter table buddy.projects enable row level security;
alter table buddy.raid_items enable row level security;
alter table buddy.decisions enable row level security;

create policy buddy_projects_owner
  on buddy.projects
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy buddy_raid_items_owner
  on buddy.raid_items
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy buddy_decisions_owner
  on buddy.decisions
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

grant usage on schema buddy to postgres, authenticated, service_role;
grant all on all tables in schema buddy to postgres, service_role;
grant select, insert, update, delete on all tables in schema buddy to authenticated;
