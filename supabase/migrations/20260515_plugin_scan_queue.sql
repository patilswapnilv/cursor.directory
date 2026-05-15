-- Create the durable Supabase Queue (pgmq) used by the plugin security scan
-- worker. Replaces the previous Vercel Workflow Development Kit pipeline
-- (`workflow` package) with a Postgres-native job queue drained by a Vercel
-- cron route.
--
-- pgmq + the pgmq_public PostgREST wrappers are already installed by the
-- Supabase Queues integration; this migration only:
--   (a) creates the `plugin_scans` queue (idempotent), and
--   (b) closes the default-open execute permissions on pgmq_public — by
--       default the wrappers are granted to anon/authenticated as well, which
--       would let any browser holding the publishable key drain or stuff our
--       scan queue. Restrict to service_role, which is what the server-side
--       admin client (SUPABASE_SECRET_KEY) authenticates as.

select pgmq.create('plugin_scans');

-- Postgres grants EXECUTE on all functions to PUBLIC by default, and Supabase
-- doesn't override that for the pgmq_public wrappers — so anon/authenticated
-- inherit access through PUBLIC even after revoking their explicit grants.
-- Revoke from PUBLIC too, then re-grant only what we actually use server-side.
revoke execute on all functions in schema pgmq_public from public, anon, authenticated;
grant  execute on all functions in schema pgmq_public to   service_role;
