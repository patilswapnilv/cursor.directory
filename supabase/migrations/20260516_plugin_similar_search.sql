-- Cheap fuzzy duplicate detection for the plugin security scan.
--
-- pg_trgm gives us a `similarity(a, b)` function and GIN index support so we
-- can find active plugins with a near-identical `name` to the one we're about
-- to scan. The drain worker passes the top candidates to the security agent
-- as additional context; the agent decides whether to flag the new plugin as
-- low_quality / spam / impersonation. No hard rule.
--
-- 0.7 is the threshold used by the worker (`runPluginScan`) and is a sensible
-- default for surfacing near-duplicates without too many false positives —
-- e.g. "Cursor Rules" vs "Cursor Rule" returns ~0.78, "Foo Plugin" vs
-- "Bar Plugin" returns ~0.4.

create extension if not exists pg_trgm with schema extensions;

-- GIN trigram index supports both the operator (`%`) and the function
-- (`similarity(...) > k`) at scale. With ~3k plugins it isn't strictly needed
-- today but keeps the function's plan stable as the table grows.
create index if not exists plugins_name_trgm_idx
  on public.plugins
  using gin (name extensions.gin_trgm_ops);

-- find_similar_plugins(p_plugin_id, p_threshold, p_limit)
--
-- Returns active, non-self plugins whose `name` has trigram similarity above
-- `p_threshold` to the named plugin, ordered by similarity desc.
--
-- SECURITY INVOKER (default) — the only caller is the scan worker via the
-- service_role admin client, which can already SELECT from `plugins` directly.
-- Locking the function down further is unnecessary and the linter flags
-- SECURITY DEFINER on functions in exposed schemas.
create or replace function public.find_similar_plugins(
  p_plugin_id uuid,
  p_threshold real default 0.7,
  p_limit int default 5
)
returns table (
  id uuid,
  name text,
  slug text,
  repository text,
  similarity real
)
language sql
stable
set search_path = public, extensions
as $$
  with src as (
    select id, name from public.plugins where id = p_plugin_id
  )
  select
    p.id,
    p.name,
    p.slug,
    p.repository,
    extensions.similarity(p.name, src.name) as similarity
  from public.plugins p
  cross join src
  where p.id <> src.id
    and p.active = true
    and extensions.similarity(p.name, src.name) > p_threshold
  order by extensions.similarity(p.name, src.name) desc
  limit p_limit;
$$;

-- Default-deny: only the server-side admin client (service_role) needs this.
revoke execute on function public.find_similar_plugins(uuid, real, int)
  from public, anon, authenticated;
grant  execute on function public.find_similar_plugins(uuid, real, int)
  to service_role;
