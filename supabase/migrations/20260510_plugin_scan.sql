-- Adds the columns required by the auto-publish security scanner.
-- The directory's plugin submission flow becomes self-running:
--   * `scan_status` tracks scan lifecycle (pending -> scanning -> safe|flagged|error)
--   * `flag_*` columns capture the agent's verdict for the admin review queue
--   * `scan_run_id` ties a row to its Cursor SDK run for observability
--   * `permanently_blocked` short-circuits future scans for confirmed-bad plugins
--   * `last_scanned_at` lets us re-run periodic sweeps without re-scanning everything

alter table plugins
  add column scan_status text not null default 'pending'
    check (scan_status in ('pending','scanning','safe','flagged','error')),
  add column scan_verdict jsonb,
  add column flag_reasons text[] not null default '{}',
  add column flag_severity text check (flag_severity in ('low','medium','high')),
  add column flag_summary text,
  add column flagged_at timestamptz,
  add column last_scanned_at timestamptz,
  add column scan_run_id text,
  add column permanently_blocked boolean not null default false;

create index plugins_scan_status_idx on plugins (scan_status);
create index plugins_flagged_at_idx on plugins (flagged_at desc nulls last);

-- Backfill existing live rows so they aren't surfaced as "pending" in the admin queue.
update plugins
  set scan_status = 'safe',
      last_scanned_at = now()
  where active = true;
