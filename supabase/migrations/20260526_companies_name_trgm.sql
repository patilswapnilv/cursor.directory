-- Speed up case-insensitive substring search (ILIKE '%term%') used by the
-- company search/typeahead, which a plain btree index cannot serve.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS companies_name_trgm
  ON public.companies USING gin (name gin_trgm_ops);
