-- Atomic plugin-star toggle: the old three-step `select` + `insert`/`delete`
-- + `increment_star_count` / `decrement_star_count` flow had no serialization,
-- so N concurrent toggles from a single user could push `plugins.star_count`
-- arbitrarily far from `count(*) from plugin_stars`.

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'plugin_stars_plugin_user_key'
  ) then
    delete from plugin_stars a
    using plugin_stars b
    where a.ctid < b.ctid
      and a.plugin_id = b.plugin_id
      and a.user_id = b.user_id;

    alter table plugin_stars
      add constraint plugin_stars_plugin_user_key unique (plugin_id, user_id);
  end if;
end
$$;

create or replace function toggle_plugin_star(plugin_id_input uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_inserted boolean := false;
  v_new_count integer;
begin
  if v_user_id is null then
    raise exception 'not authenticated'
      using errcode = '28000';
  end if;

  -- Serialize concurrent toggles for the same plugin.
  perform 1 from plugins where id = plugin_id_input for update;

  insert into plugin_stars (plugin_id, user_id)
  values (plugin_id_input, v_user_id)
  on conflict (plugin_id, user_id) do nothing
  returning true into v_inserted;

  if not coalesce(v_inserted, false) then
    delete from plugin_stars
    where plugin_id = plugin_id_input
      and user_id = v_user_id;
  end if;

  -- Derive star_count from count(*) so the cached value can't drift.
  update plugins
  set star_count = (
    select count(*) from plugin_stars where plugin_id = plugin_id_input
  )
  where id = plugin_id_input
  returning star_count into v_new_count;

  return jsonb_build_object(
    'starred', coalesce(v_inserted, false),
    'count', coalesce(v_new_count, 0)
  );
end;
$$;

revoke all on function toggle_plugin_star(uuid) from public;
grant execute on function toggle_plugin_star(uuid) to authenticated;

drop function if exists increment_star_count(uuid);
drop function if exists decrement_star_count(uuid);

-- Backfill any rows whose cached count had already drifted.
update plugins p
set star_count = sub.cnt
from (
  select plugin_id, count(*) as cnt
  from plugin_stars
  group by plugin_id
) sub
where p.id = sub.plugin_id
  and p.star_count is distinct from sub.cnt;

update plugins
set star_count = 0
where star_count is distinct from 0
  and id not in (select distinct plugin_id from plugin_stars);
