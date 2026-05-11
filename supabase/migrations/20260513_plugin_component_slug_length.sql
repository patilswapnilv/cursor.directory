-- Cap `plugin_components.slug` at 80 characters.
--
-- Why: the per-rule API route (`apps/cursor/src/app/api/[slug]/route.ts`) is
-- `force-static`, so Vercel writes a `<slug>.prerender-config.json` file per
-- known rule slug at build time. A 251-char slug from a verbosely-named rule
-- pushed past the 255-byte filesystem name limit and broke `bun run build`
-- with ENAMETOOLONG.
--
-- This migration shortens any oversized slug in place (collisions are
-- vanishingly unlikely at the current catalog size; if one occurs the second
-- update below disambiguates with a numeric suffix), then enforces the cap
-- going forward. Application code (`lib/github-plugin/parse.ts` and
-- `lib/plugins/insert.ts`) also caps at 80 chars so this is belt-and-suspenders.

-- 1. Truncate to 80 chars, stripping any trailing `-` if the cut lands on one.
update plugin_components
  set slug = regexp_replace(left(slug, 80), '-+$', '')
  where length(slug) > 80;

-- 2. Disambiguate any duplicate (plugin_id, slug) pairs created by the cut.
-- Most plugins have unique component slugs already; this is defensive.
with dupes as (
  select
    id,
    row_number() over (
      partition by plugin_id, slug
      order by sort_order, id
    ) as rn,
    slug
  from plugin_components
)
update plugin_components pc
  set slug = left(d.slug, 76) || '-' || lpad(d.rn::text, 3, '0')
  from dupes d
  where pc.id = d.id and d.rn > 1;

-- 3. Enforce the cap going forward.
alter table plugin_components drop constraint if exists plugin_components_slug_length_check;
alter table plugin_components
  add constraint plugin_components_slug_length_check
  check (length(slug) <= 80);
