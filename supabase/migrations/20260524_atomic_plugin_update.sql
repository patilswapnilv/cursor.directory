-- Keep plugin metadata updates and component rewrites in a single transaction.
-- If a component row fails validation, Postgres rolls back the delist/reset too.
create or replace function public.update_plugin_with_components(
  p_plugin_id uuid,
  p_name text,
  p_description text,
  p_logo text,
  p_repository text,
  p_homepage text,
  p_keywords text[],
  p_components jsonb,
  p_deactivate_for_scan boolean
)
returns void
language plpgsql
set search_path = public
as $$
begin
  update public.plugins
  set
    name = p_name,
    description = p_description,
    logo = p_logo,
    repository = p_repository,
    homepage = p_homepage,
    keywords = coalesce(p_keywords, '{}'::text[]),
    active = case when p_deactivate_for_scan then false else active end,
    scan_status = case
      when p_deactivate_for_scan then 'pending'
      else scan_status
    end,
    flag_summary = case when p_deactivate_for_scan then null else flag_summary end,
    flag_reasons = case
      when p_deactivate_for_scan then '{}'::text[]
      else flag_reasons
    end,
    flag_severity = case when p_deactivate_for_scan then null else flag_severity end,
    flagged_at = case when p_deactivate_for_scan then null else flagged_at end
  where id = p_plugin_id;

  if not found then
    raise exception 'plugin not found'
      using errcode = 'P0002';
  end if;

  delete from public.plugin_components
  where plugin_id = p_plugin_id;

  insert into public.plugin_components (
    plugin_id,
    type,
    name,
    slug,
    description,
    content,
    metadata,
    sort_order
  )
  select
    p_plugin_id,
    component.type,
    component.name,
    component.slug,
    component.description,
    component.content,
    coalesce(component.metadata, '{}'::jsonb),
    component.sort_order
  from jsonb_to_recordset(p_components) as component(
    type text,
    name text,
    slug text,
    description text,
    content text,
    metadata jsonb,
    sort_order integer
  );
end;
$$;

revoke execute on function public.update_plugin_with_components(
  uuid, text, text, text, text, text, text[], jsonb, boolean
) from public, anon, authenticated;
grant execute on function public.update_plugin_with_components(
  uuid, text, text, text, text, text, text[], jsonb, boolean
) to service_role;
