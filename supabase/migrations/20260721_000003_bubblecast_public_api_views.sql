-- Bubblecast API surface via public.bubblecast_* views only.
-- Data remains in schema bubblecast. Does not modify other apps' objects.
-- Applied remotely as: bubblecast_public_api_views

create or replace view public.bubblecast_profiles
with (security_invoker = true) as
  select * from bubblecast.profiles;

create or replace view public.bubblecast_vocab
with (security_invoker = true) as
  select * from bubblecast.vocab;

create or replace view public.bubblecast_relationships
with (security_invoker = true) as
  select * from bubblecast.relationships;

create or replace view public.bubblecast_mission_runs
with (security_invoker = true) as
  select * from bubblecast.mission_runs;

grant select, insert, update, delete on public.bubblecast_profiles to anon, authenticated, service_role;
grant select, insert, update, delete on public.bubblecast_vocab to anon, authenticated, service_role;
grant select, insert, update, delete on public.bubblecast_relationships to anon, authenticated, service_role;
grant select, insert, update, delete on public.bubblecast_mission_runs to anon, authenticated, service_role;

comment on view public.bubblecast_profiles is 'Bubblecast API view → bubblecast.profiles';
comment on view public.bubblecast_vocab is 'Bubblecast API view → bubblecast.vocab';
comment on view public.bubblecast_relationships is 'Bubblecast API view → bubblecast.relationships';
comment on view public.bubblecast_mission_runs is 'Bubblecast API view → bubblecast.mission_runs';

insert into bubblecast.schema_migrations (id)
values ('20260721_000003_public_api_views')
on conflict (id) do nothing;

notify pgrst, 'reload schema';
