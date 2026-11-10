-- Run in STAGING Supabase SQL Editor. Deletes archived test client and FK-dependent public records atomically.
-- Only the service role can execute the public entrypoint.
create or replace function public._delete_client_dependents(p_table regclass, p_filter text, p_depth integer default 0)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
declare
  fk record;
  child_cols text;
  parent_cols text;
  child_filter text;
  has_rows boolean;
begin
  if p_depth > 30 then raise exception 'Client deletion dependency depth exceeded'; end if;
  for fk in
    select c.oid, c.conrelid, c.confrelid, c.conkey, c.confkey
    from pg_constraint c
    join pg_class cl on cl.oid = c.conrelid
    join pg_namespace ns on ns.oid = cl.relnamespace
    where c.contype = 'f' and c.confrelid = p_table and ns.nspname = 'public'
  loop
    select string_agg(format('%I', a.attname), ', ' order by u.ord)
      into child_cols
      from unnest(fk.conkey) with ordinality u(attnum, ord)
      join pg_attribute a on a.attrelid = fk.conrelid and a.attnum = u.attnum;
    select string_agg(format('%I', a.attname), ', ' order by u.ord)
      into parent_cols
      from unnest(fk.confkey) with ordinality u(attnum, ord)
      join pg_attribute a on a.attrelid = fk.confrelid and a.attnum = u.attnum;
    child_filter := format('(%s) in (select %s from %s where %s)', child_cols, parent_cols, p_table::text, p_filter);
    execute format('select exists(select 1 from %s where %s)', fk.conrelid::text, child_filter) into has_rows;
    if has_rows then
      perform public._delete_client_dependents(fk.conrelid, child_filter, p_depth + 1);
    end if;
  end loop;
  execute format('delete from %s where %s', p_table::text, p_filter);
end $$;

create or replace function public.admin_delete_archived_client(p_client_id uuid, p_admin_id uuid)
returns void language plpgsql security invoker set search_path = pg_catalog as $$
begin
  if not exists (select 1 from public.users where id = p_admin_id and role = 'admin') then
    raise exception 'Administrator required';
  end if;
  if p_client_id = p_admin_id or not exists (
    select 1 from public.users u join public.archived_clients a on a.client_id = u.id
    where u.id = p_client_id and u.role = 'client'
  ) then
    raise exception 'Client must be archived';
  end if;
  perform public._delete_client_dependents('public.users'::regclass, format('id = %L::uuid', p_client_id));
end $$;

revoke all on function public._delete_client_dependents(regclass,text,integer) from public, anon, authenticated;
revoke all on function public.admin_delete_archived_client(uuid,uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_archived_client(uuid,uuid) to service_role;
grant execute on function public._delete_client_dependents(regclass,text,integer) to service_role;
