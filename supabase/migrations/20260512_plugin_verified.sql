-- Plugin verification: admin-controlled "Verified" badge plus an owner-driven
-- request flow.
--
--   * `verified` — the badge state (boolean, default false)
--   * `verified_at` / `verified_by` — when and who marked it verified
--   * `verification_requested_at` — set when an owner submits for review;
--     cleared on admin approve or deny

alter table public.plugins
  add column if not exists verified boolean not null default false,
  add column if not exists verified_at timestamptz,
  add column if not exists verified_by uuid references auth.users(id) on delete set null,
  add column if not exists verification_requested_at timestamptz;

create index if not exists plugins_verified_idx
  on public.plugins (verified) where verified = true;

create index if not exists plugins_verification_requested_idx
  on public.plugins (verification_requested_at desc nulls last)
  where verification_requested_at is not null and verified = false;
