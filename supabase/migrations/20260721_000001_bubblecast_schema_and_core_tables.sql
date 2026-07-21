-- Bubblecast-only migration. Do not modify other schemas/apps.
-- Applied remotely as: bubblecast_schema_and_core_tables

create schema if not exists bubblecast;

comment on schema bubblecast is 'Bubblecast language tutor app — isolated multi-app tenant on shared Supabase project';

create table if not exists bubblecast.schema_migrations (
  id text primary key,
  applied_at timestamptz not null default now()
);

insert into bubblecast.schema_migrations (id)
values ('20260721_000001_schema_and_core_tables')
on conflict (id) do nothing;

create table if not exists bubblecast.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Traveler',
  cefr text not null default 'A1' check (cefr in ('A1', 'A2', 'B1', 'B2')),
  target_language text not null default 'Spanish',
  native_language text not null default 'English',
  xp integer not null default 0 check (xp >= 0),
  completed_mission_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists bubblecast.vocab (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references bubblecast.profiles (id) on delete cascade,
  word text not null,
  gloss text not null default '',
  status text not null default 'new' check (status in ('new', 'fuzzy', 'known')),
  times_seen integer not null default 1 check (times_seen >= 0),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, word)
);

create index if not exists bubblecast_vocab_user_id_idx
  on bubblecast.vocab (user_id);

create table if not exists bubblecast.relationships (
  user_id uuid not null references bubblecast.profiles (id) on delete cascade,
  character_id text not null,
  score integer not null default 20 check (score >= 0 and score <= 100),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  primary key (user_id, character_id)
);

create table if not exists bubblecast.mission_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references bubblecast.profiles (id) on delete cascade,
  mission_id text not null,
  outcome text not null check (outcome in ('success', 'partial', 'fail')),
  score integer not null default 0 check (score >= 0 and score <= 100),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  summary text not null default '',
  debrief jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bubblecast_mission_runs_user_id_idx
  on bubblecast.mission_runs (user_id, created_at desc);

create index if not exists bubblecast_mission_runs_mission_idx
  on bubblecast.mission_runs (user_id, mission_id);

create or replace function bubblecast.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists bubblecast_profiles_set_updated_at on bubblecast.profiles;
create trigger bubblecast_profiles_set_updated_at
  before update on bubblecast.profiles
  for each row execute function bubblecast.set_updated_at();

drop trigger if exists bubblecast_relationships_set_updated_at on bubblecast.relationships;
create trigger bubblecast_relationships_set_updated_at
  before update on bubblecast.relationships
  for each row execute function bubblecast.set_updated_at();

grant usage on schema bubblecast to anon, authenticated, service_role;

grant select, insert, update, delete on all tables in schema bubblecast to authenticated;
grant select, insert, update, delete on all tables in schema bubblecast to anon;
grant all on all tables in schema bubblecast to service_role;

grant usage, select on all sequences in schema bubblecast to authenticated, anon, service_role;

alter default privileges in schema bubblecast
  grant select, insert, update, delete on tables to authenticated, anon;

alter default privileges in schema bubblecast
  grant all on tables to service_role;
