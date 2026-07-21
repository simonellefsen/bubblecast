-- Bubblecast RLS only. No other schemas touched.
-- Applied remotely as: bubblecast_rls_policies

alter table bubblecast.profiles enable row level security;
alter table bubblecast.vocab enable row level security;
alter table bubblecast.relationships enable row level security;
alter table bubblecast.mission_runs enable row level security;
alter table bubblecast.schema_migrations enable row level security;

drop policy if exists bubblecast_schema_migrations_deny_all on bubblecast.schema_migrations;
create policy bubblecast_schema_migrations_deny_all
  on bubblecast.schema_migrations
  for all
  using (false)
  with check (false);

drop policy if exists bubblecast_profiles_select_own on bubblecast.profiles;
create policy bubblecast_profiles_select_own
  on bubblecast.profiles for select
  to authenticated, anon
  using (auth.uid() = id);

drop policy if exists bubblecast_profiles_insert_own on bubblecast.profiles;
create policy bubblecast_profiles_insert_own
  on bubblecast.profiles for insert
  to authenticated, anon
  with check (auth.uid() = id);

drop policy if exists bubblecast_profiles_update_own on bubblecast.profiles;
create policy bubblecast_profiles_update_own
  on bubblecast.profiles for update
  to authenticated, anon
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists bubblecast_vocab_select_own on bubblecast.vocab;
create policy bubblecast_vocab_select_own
  on bubblecast.vocab for select
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists bubblecast_vocab_insert_own on bubblecast.vocab;
create policy bubblecast_vocab_insert_own
  on bubblecast.vocab for insert
  to authenticated, anon
  with check (auth.uid() = user_id);

drop policy if exists bubblecast_vocab_update_own on bubblecast.vocab;
create policy bubblecast_vocab_update_own
  on bubblecast.vocab for update
  to authenticated, anon
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bubblecast_vocab_delete_own on bubblecast.vocab;
create policy bubblecast_vocab_delete_own
  on bubblecast.vocab for delete
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists bubblecast_relationships_select_own on bubblecast.relationships;
create policy bubblecast_relationships_select_own
  on bubblecast.relationships for select
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists bubblecast_relationships_insert_own on bubblecast.relationships;
create policy bubblecast_relationships_insert_own
  on bubblecast.relationships for insert
  to authenticated, anon
  with check (auth.uid() = user_id);

drop policy if exists bubblecast_relationships_update_own on bubblecast.relationships;
create policy bubblecast_relationships_update_own
  on bubblecast.relationships for update
  to authenticated, anon
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bubblecast_relationships_delete_own on bubblecast.relationships;
create policy bubblecast_relationships_delete_own
  on bubblecast.relationships for delete
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists bubblecast_mission_runs_select_own on bubblecast.mission_runs;
create policy bubblecast_mission_runs_select_own
  on bubblecast.mission_runs for select
  to authenticated, anon
  using (auth.uid() = user_id);

drop policy if exists bubblecast_mission_runs_insert_own on bubblecast.mission_runs;
create policy bubblecast_mission_runs_insert_own
  on bubblecast.mission_runs for insert
  to authenticated, anon
  with check (auth.uid() = user_id);

insert into bubblecast.schema_migrations (id)
values ('20260721_000002_rls_policies')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
