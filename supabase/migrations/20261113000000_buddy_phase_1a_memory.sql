-- Buddy Phase 1a: profiles, private thoughts, memory sync metadata, provenance columns.

alter table buddy.raid_items
  add column if not exists source text,
  add column if not exists label text check (
    label is null or label in ('fact', 'inference', 'general_practice')
  );

alter table buddy.decisions
  add column if not exists source text,
  add column if not exists label text check (
    label is null or label in ('fact', 'inference', 'general_practice')
  );

create table buddy.profiles (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  pushback_level text not null default 'standard' check (
    pushback_level in ('gentle', 'standard', 'tough')
  ),
  working_hours jsonb not null default '{}'::jsonb,
  autonomy jsonb not null default '{
    "morning_check_in": "draft",
    "stakeholder_message": "draft",
    "calendar_change": "draft",
    "ticket_create": "draft",
    "slack_nudge": "draft"
  }'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buddy.private_thoughts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid references buddy.projects (id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table buddy.memory_sources (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  source text not null,
  label text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, source)
);

create index buddy_private_thoughts_owner_idx on buddy.private_thoughts (owner_id);
create index buddy_memory_sources_owner_idx on buddy.memory_sources (owner_id);

alter table buddy.profiles enable row level security;
alter table buddy.private_thoughts enable row level security;
alter table buddy.memory_sources enable row level security;

create policy buddy_profiles_owner
  on buddy.profiles
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy buddy_private_thoughts_owner
  on buddy.private_thoughts
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy buddy_memory_sources_owner
  on buddy.memory_sources
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

grant select, insert, update, delete on buddy.profiles to authenticated;
grant select, insert, update, delete on buddy.private_thoughts to authenticated;
grant select, insert, update, delete on buddy.memory_sources to authenticated;
