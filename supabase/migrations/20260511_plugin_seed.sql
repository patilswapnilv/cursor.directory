-- Schema changes to support the one-shot bulk seed from Cursor's official
-- plugin spec (see scripts/extract-from-github.ts and scripts/insert-from-jsonl.ts).
--
--   * `owner_id` becomes nullable so seed rows (no human owner) can exist
--   * `discovery_source` records provenance (e.g. 'user', 'seed:cursor-spec')
--   * `github_repo_id` is GitHub's stable numeric repo id; doubles as the
--     idempotency key for re-imports and survives owner/repo renames
--   * `scan_status` gains an 'unscanned' value for seeded rows we publish
--     immediately without paying for a Cursor SDK scan

alter table plugins
  alter column owner_id drop not null;

alter table plugins
  add column if not exists discovery_source text,
  add column if not exists github_repo_id bigint;

create unique index if not exists plugins_github_repo_id_unique
  on plugins (github_repo_id)
  where github_repo_id is not null;

alter table plugins drop constraint if exists plugins_scan_status_check;
alter table plugins
  add constraint plugins_scan_status_check
  check (scan_status in (
    'pending',
    'scanning',
    'safe',
    'flagged',
    'error',
    'unscanned'
  ));
