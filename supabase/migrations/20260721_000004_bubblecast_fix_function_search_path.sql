-- Harden bubblecast.set_updated_at search_path only.
create or replace function bubblecast.set_updated_at()
returns trigger
language plpgsql
set search_path = bubblecast, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

insert into bubblecast.schema_migrations (id)
values ('20260721_000004_fix_function_search_path')
on conflict (id) do nothing;
