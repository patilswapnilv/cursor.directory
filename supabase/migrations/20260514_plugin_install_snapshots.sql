-- Daily snapshots of `plugins.install_count` so we can rank by recent
-- velocity (e.g. "Trending = installs over the last 30 days") instead
-- of relying solely on lifetime totals, which over-favor older plugins.
--
-- Populated by `snapshot_plugin_installs()` (defined below), which is
-- scheduled to run daily by Supabase Cron / pg_cron. No application
-- code or HTTP route is involved — the snapshot lives entirely in the
-- database layer. One row per (plugin_id, snapshot_date), and rows
-- older than ~400 days are pruned so the table stays bounded.

create table if not exists plugin_install_snapshots (
  plugin_id uuid not null references plugins(id) on delete cascade,
  snapshot_date date not null,
  install_count integer not null,
  primary key (plugin_id, snapshot_date)
);

create index if not exists plugin_install_snapshots_date_idx
  on plugin_install_snapshots (snapshot_date desc);

-- Returns each active plugin's install velocity over the last
-- `window_days` days. Two cases:
--
--   1. Plugin is younger than the window: every install necessarily
--      happened within the window, so velocity = install_count. This
--      lets the Trending leaderboard surface brand-new plugins gaining
--      traction without waiting a full month of snapshot history.
--
--   2. Plugin is older than the window: velocity = current install_count
--      minus the install_count from `window_days` ago. Until we have a
--      snapshot that old, we fall back to the earliest snapshot we have
--      so velocity ramps up gracefully rather than reporting zero.
--
-- Negative deltas (e.g. an install_count reset) are clamped to 0.
create or replace function plugin_install_velocity(window_days int default 30)
returns table (plugin_id uuid, installs_window int)
language sql
stable
as $$
  with target as (
    select
      p.id as plugin_id,
      p.install_count as current_count,
      p.created_at::date as created_date,
      coalesce(
        (
          select s.install_count
          from plugin_install_snapshots s
          where s.plugin_id = p.id
            and s.snapshot_date <= (current_date - window_days)
          order by s.snapshot_date desc
          limit 1
        ),
        (
          select s.install_count
          from plugin_install_snapshots s
          where s.plugin_id = p.id
          order by s.snapshot_date asc
          limit 1
        )
      ) as baseline
    from plugins p
    where p.active = true
  )
  select
    plugin_id,
    case
      when created_date >= (current_date - window_days) then current_count
      else greatest(current_count - coalesce(baseline, current_count), 0)::int
    end as installs_window
  from target;
$$;

-- Snapshot routine: idempotent on (plugin_id, snapshot_date) so safe to
-- re-run within the same day. Active plugins only — soft-deleted plugins
-- shouldn't accumulate rows. Pruning runs in the same call so retention
-- can never silently drift.
create or replace function snapshot_plugin_installs()
returns void
language plpgsql
as $$
begin
  insert into plugin_install_snapshots (plugin_id, snapshot_date, install_count)
  select id, current_date, install_count
  from plugins
  where active = true
  on conflict (plugin_id, snapshot_date) do update
    set install_count = excluded.install_count;

  delete from plugin_install_snapshots
  where snapshot_date < current_date - interval '400 days';
end;
$$;

-- Schedule the snapshot via Supabase Cron (pg_cron under the hood).
-- Runs daily at 00:05 UTC. No HTTP route, no CRON_SECRET, no Vercel
-- coupling: the schedule lives in the database alongside the data.
--
-- Requires the `pg_cron` extension. Supabase ships with it preinstalled
-- but disabled; this enables it. If the role running the migration
-- can't enable extensions (e.g. local dev without superuser), enable
-- it once via Supabase Dashboard → Database → Extensions → pg_cron and
-- comment the next line out.
create extension if not exists pg_cron;

-- Idempotent: drop any previous schedule before recreating, so this
-- migration can be re-applied without raising "duplicate jobname".
do $$
begin
  if exists (
    select 1 from cron.job where jobname = 'plugin-install-daily-snapshot'
  ) then
    perform cron.unschedule('plugin-install-daily-snapshot');
  end if;
end$$;

select cron.schedule(
  'plugin-install-daily-snapshot',
  '5 0 * * *',
  $$ select snapshot_plugin_installs(); $$
);
