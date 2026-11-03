-- RLS on by default (BACKLOG P0). Every table created in the public schema gets row level security
-- switched on the moment it is created, so a table can never be exposed through the API by accident.
-- With RLS on and no policy, the anon and authenticated roles can read and write nothing.

create or replace function public.sigil_enable_rls_on_new_tables()
returns event_trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  obj record;
begin
  for obj in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type = 'table'
      and schema_name = 'public'
  loop
    execute format('alter table %s enable row level security', obj.object_identity);
  end loop;
end;
$$;

revoke all on function public.sigil_enable_rls_on_new_tables() from public, anon, authenticated;

drop event trigger if exists sigil_rls_on_create;
create event trigger sigil_rls_on_create
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.sigil_enable_rls_on_new_tables();
