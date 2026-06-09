-- LOCAL DEVELOPMENT BOOTSTRAP — reconstruction of the base schema that the
-- hosted Supabase project already has. The repo's dated migrations
-- (20260510_* onwards) only contain incremental changes and assume these
-- tables/functions/triggers pre-exist. This file recreates them so a fresh
-- `supabase start` / `supabase db reset` works locally.
--
-- Safety: every statement is guarded (`if not exists` / existence checks in
-- DO blocks) so this file is a no-op when the objects already exist (e.g. if
-- it is ever pushed to the hosted project by mistake). It never replaces an
-- existing object.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- pgmq + pgmq_public wrappers (normally installed by the hosted "Queues"
-- integration; see 20260515_plugin_scan_queue.sql which assumes they exist).
-- ---------------------------------------------------------------------------
create extension if not exists pgmq;

create schema if not exists pgmq_public;
grant usage on schema pgmq_public to postgres, anon, authenticated, service_role;

do $$
begin
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'send'
  ) then
    create function pgmq_public.send(
      queue_name text,
      message jsonb,
      sleep_seconds integer default 0
    )
    returns setof bigint
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return query
      select * from pgmq.send(
        queue_name => send.queue_name,
        msg => send.message,
        delay => send.sleep_seconds
      );
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'send_batch'
  ) then
    create function pgmq_public.send_batch(
      queue_name text,
      messages jsonb[],
      sleep_seconds integer default 0
    )
    returns setof bigint
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return query
      select * from pgmq.send_batch(
        queue_name => send_batch.queue_name,
        msgs => send_batch.messages,
        delay => send_batch.sleep_seconds
      );
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'read'
  ) then
    create function pgmq_public.read(
      queue_name text,
      sleep_seconds integer,
      n integer
    )
    returns setof pgmq.message_record
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return query
      select * from pgmq.read(
        queue_name => read.queue_name,
        vt => read.sleep_seconds,
        qty => read.n
      );
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'pop'
  ) then
    create function pgmq_public.pop(queue_name text)
    returns setof pgmq.message_record
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return query
      select * from pgmq.pop(queue_name => pop.queue_name);
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'archive'
  ) then
    create function pgmq_public.archive(
      queue_name text,
      message_id bigint
    )
    returns boolean
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return pgmq.archive(
        queue_name => archive.queue_name,
        msg_id => archive.message_id
      );
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'pgmq_public' and p.proname = 'delete'
  ) then
    create function pgmq_public."delete"(
      queue_name text,
      message_id bigint
    )
    returns boolean
    language plpgsql
    security definer
    set search_path = ''
    as $fn$
    begin
      return pgmq."delete"(
        queue_name => "delete".queue_name,
        msg_id => "delete".message_id
      );
    end;
    $fn$;
  end if;
end$$;

-- 20260515_plugin_scan_queue.sql re-scopes these grants to service_role only.
grant execute on all functions in schema pgmq_public to service_role;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'unknown user',
  email text,
  slug text not null unique,
  image text,
  hero text,
  status text,
  bio text,
  work text,
  website text,
  social_x_link text,
  public boolean not null default true,
  follow_email boolean not null default true,
  is_ambassador boolean not null default false,
  is_following boolean not null default false,
  follower_count integer not null default 0,
  following_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id text primary key,
  name text not null,
  slug text not null unique,
  image text,
  location text,
  bio text,
  website text,
  social_x_link text,
  hero text,
  public boolean not null default true,
  owner_id uuid references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.plugins (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  version text not null default '1.0.0',
  description text,
  homepage text,
  repository text,
  license text,
  logo text,
  keywords text[] not null default '{}',
  author_name text,
  author_url text,
  author_avatar text,
  owner_id uuid not null references public.users (id) on delete cascade,
  active boolean not null default false,
  plan text not null default 'standard',
  "order" integer not null default 0,
  install_count integer not null default 0,
  star_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plugin_components (
  id uuid primary key default gen_random_uuid(),
  plugin_id uuid not null references public.plugins (id) on delete cascade,
  type text not null check (
    type in ('rule', 'mcp_server', 'skill', 'agent', 'hook', 'lsp_server', 'command')
  ),
  name text not null,
  slug text not null,
  description text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- No unique constraint on (plugin_id, slug): the hosted schema tolerates
-- duplicate component slugs (20260513 disambiguates data instead of
-- enforcing uniqueness).

create table if not exists public.plugin_stars (
  id uuid primary key default gen_random_uuid(),
  plugin_id uuid not null references public.plugins (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.followers (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users (id) on delete cascade,
  following_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create table if not exists public.mcps (
  id text primary key,
  name text not null,
  slug text not null unique,
  description text,
  link text,
  logo text,
  config jsonb,
  company_id text references public.companies (id) on delete set null,
  owner_id uuid references public.users (id) on delete set null,
  active boolean not null default true,
  plan text not null default 'standard',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  fts tsvector generated always as (
    to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
  ) stored
);

-- ---------------------------------------------------------------------------
-- Functions + triggers (only created when absent, never replaced)
-- ---------------------------------------------------------------------------

do $$
begin
  -- Provision a public.users profile row when an auth user signs up.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'handle_new_user'
  ) then
    create function public.handle_new_user()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    declare
      v_name text := coalesce(
        nullif(new.raw_user_meta_data ->> 'name', ''),
        nullif(new.raw_user_meta_data ->> 'full_name', ''),
        nullif(new.raw_user_meta_data ->> 'user_name', ''),
        'unknown user'
      );
      v_slug text;
    begin
      v_slug := btrim(
        regexp_replace(
          lower(coalesce(nullif(v_name, 'unknown user'), split_part(new.email, '@', 1), 'user')),
          '[^a-z0-9]+', '-', 'g'
        ),
        '-'
      );
      if v_slug is null or v_slug = '' then
        v_slug := 'user';
      end if;
      if exists (select 1 from public.users u where u.slug = v_slug) then
        v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
      end if;

      insert into public.users (id, name, email, slug, image)
      values (
        new.id,
        v_name,
        new.email,
        v_slug,
        new.raw_user_meta_data ->> 'avatar_url'
      )
      on conflict (id) do nothing;

      return new;
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'on_auth_user_created'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute function public.handle_new_user();
  end if;

  -- Slug generation for plugins (app inserts without a slug).
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'generate_plugin_slug'
  ) then
    create function public.generate_plugin_slug()
    returns trigger
    language plpgsql
    set search_path = public
    as $fn$
    declare
      v_slug text;
    begin
      if new.slug is not null and new.slug <> '' then
        return new;
      end if;
      v_slug := btrim(regexp_replace(lower(new.name), '[^a-z0-9]+', '-', 'g'), '-');
      if v_slug is null or v_slug = '' then
        v_slug := 'plugin';
      end if;
      v_slug := left(v_slug, 80);
      if exists (select 1 from public.plugins p where p.slug = v_slug) then
        v_slug := left(v_slug, 73) || '-' || substr(md5(random()::text), 1, 6);
      end if;
      new.slug := v_slug;
      return new;
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'plugins_generate_slug'
  ) then
    create trigger plugins_generate_slug
      before insert on public.plugins
      for each row execute function public.generate_plugin_slug();
  end if;

  -- Slug generation for companies (referenced by src/actions/upsert-company.ts).
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'generate_company_slug'
  ) then
    create function public.generate_company_slug()
    returns trigger
    language plpgsql
    set search_path = public
    as $fn$
    declare
      v_slug text;
    begin
      if new.slug is not null and new.slug <> '' then
        return new;
      end if;
      v_slug := btrim(regexp_replace(lower(new.name), '[^a-z0-9]+', '-', 'g'), '-');
      if v_slug is null or v_slug = '' then
        v_slug := 'company';
      end if;
      if exists (select 1 from public.companies c where c.slug = v_slug) then
        v_slug := v_slug || '-' || substr(md5(random()::text), 1, 6);
      end if;
      new.slug := v_slug;
      return new;
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'companies_generate_slug'
  ) then
    create trigger companies_generate_slug
      before insert on public.companies
      for each row execute function public.generate_company_slug();
  end if;

  -- Keep plugins.updated_at fresh (used by the recover-stuck-scans cron).
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger
    language plpgsql
    as $fn$
    begin
      new.updated_at := now();
      return new;
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'plugins_set_updated_at'
  ) then
    create trigger plugins_set_updated_at
      before update on public.plugins
      for each row execute function public.set_updated_at();
  end if;

  -- Denormalized follower/following counts on public.users.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'update_follow_counts'
  ) then
    create function public.update_follow_counts()
    returns trigger
    language plpgsql
    security definer
    set search_path = public
    as $fn$
    begin
      if tg_op = 'INSERT' then
        update public.users set follower_count = follower_count + 1
          where id = new.following_id;
        update public.users set following_count = following_count + 1
          where id = new.follower_id;
        return new;
      elsif tg_op = 'DELETE' then
        update public.users set follower_count = greatest(follower_count - 1, 0)
          where id = old.following_id;
        update public.users set following_count = greatest(following_count - 1, 0)
          where id = old.follower_id;
        return old;
      end if;
      return null;
    end;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'followers_update_counts'
  ) then
    create trigger followers_update_counts
      after insert or delete on public.followers
      for each row execute function public.update_follow_counts();
  end if;

  -- Atomic install counter, called via .rpc("increment_install_count", ...).
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'increment_install_count'
  ) then
    create function public.increment_install_count(plugin_id_input uuid)
    returns void
    language sql
    set search_path = public
    as $fn$
      update public.plugins
        set install_count = install_count + 1
        where id = plugin_id_input;
    $fn$;
  end if;

  -- Star counters; superseded (and dropped) by 20260523_plugin_star_atomic.sql.
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'increment_star_count'
  ) then
    create function public.increment_star_count(plugin_id_input uuid)
    returns void
    language sql
    set search_path = public
    as $fn$
      update public.plugins
        set star_count = star_count + 1
        where id = plugin_id_input;
    $fn$;
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'decrement_star_count'
  ) then
    create function public.decrement_star_count(plugin_id_input uuid)
    returns void
    language sql
    set search_path = public
    as $fn$
      update public.plugins
        set star_count = greatest(star_count - 1, 0)
        where id = plugin_id_input;
    $fn$;
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Function privileges: increment_install_count is invoked only from the
-- service-role admin client (src/actions/track-install.ts). Postgres grants
-- EXECUTE to PUBLIC by default, so without this any anon/authenticated caller
-- could inflate plugins.install_count via PostgREST. Revoke it and re-grant to
-- service_role only (mirrors the hardening on later RPCs such as
-- update_plugin_with_components and toggle_plugin_star).
-- ---------------------------------------------------------------------------
revoke execute on function public.increment_install_count(uuid) from public, anon, authenticated;
grant execute on function public.increment_install_count(uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security. The hosted base schema enforces RLS on these tables and
-- the app's browser/cookie-scoped clients (anon / authenticated) rely on it,
-- while the service-role admin client bypasses RLS. Enable RLS and add policies
-- that mirror that posture so a fresh local database matches production instead
-- of leaving every row world-readable/writable.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'users', 'companies', 'plugins', 'plugin_components', 'plugin_stars',
    'followers', 'mcps'
  ] loop
    if not exists (
      select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = t and c.relrowsecurity
    ) then
      execute format('alter table public.%I enable row level security', t);
    end if;
  end loop;
end$$;

do $$
begin
  -- users: a session may read and edit only its own profile row. Public
  -- profile and directory reads run through the service-role admin client.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_select_own') then
    create policy users_select_own on public.users
      for select to authenticated using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'users' and policyname = 'users_update_own') then
    create policy users_update_own on public.users
      for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;

  -- companies: public rows are readable by anyone (directory search) and a user
  -- always sees and owns the companies they created.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'companies_select_public_or_own') then
    create policy companies_select_public_or_own on public.companies
      for select using (public = true or (select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'companies_insert_own') then
    create policy companies_insert_own on public.companies
      for insert to authenticated with check ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'companies' and policyname = 'companies_update_own') then
    create policy companies_update_own on public.companies
      for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
  end if;

  -- plugins: active listings are world-readable; owners read/modify their own
  -- rows (seed rows have a null owner_id and are reachable only via active).
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plugins' and policyname = 'plugins_select_active_or_own') then
    create policy plugins_select_active_or_own on public.plugins
      for select using (active = true or (select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plugins' and policyname = 'plugins_update_own') then
    create policy plugins_update_own on public.plugins
      for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plugins' and policyname = 'plugins_delete_own') then
    create policy plugins_delete_own on public.plugins
      for delete to authenticated using ((select auth.uid()) = owner_id);
  end if;

  -- followers: a user manages only the rows where they are the follower.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'followers' and policyname = 'followers_select_own') then
    create policy followers_select_own on public.followers
      for select to authenticated using ((select auth.uid()) = follower_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'followers' and policyname = 'followers_insert_own') then
    create policy followers_insert_own on public.followers
      for insert to authenticated with check ((select auth.uid()) = follower_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'followers' and policyname = 'followers_delete_own') then
    create policy followers_delete_own on public.followers
      for delete to authenticated using ((select auth.uid()) = follower_id);
  end if;

  -- plugin_stars: a user reads only their own stars; writes go through the
  -- SECURITY DEFINER toggle_plugin_star RPC (20260523_plugin_star_atomic.sql).
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'plugin_stars' and policyname = 'plugin_stars_select_own') then
    create policy plugin_stars_select_own on public.plugin_stars
      for select to authenticated using ((select auth.uid()) = user_id);
  end if;

  -- mcps: active listings are world-readable; owners modify their own rows.
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mcps' and policyname = 'mcps_select_active_or_own') then
    create policy mcps_select_active_or_own on public.mcps
      for select using (active = true or (select auth.uid()) = owner_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'mcps' and policyname = 'mcps_update_own') then
    create policy mcps_update_own on public.mcps
      for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);
  end if;

  -- plugin_components is intentionally left without an anon/authenticated
  -- policy: it is written by the admin client and read via plugin joins on the
  -- server, so RLS denies all direct Data API access (service_role bypasses it).
end$$;

-- ---------------------------------------------------------------------------
-- Storage: policies for the public `avatars` bucket (bucket itself is declared
-- in supabase/config.toml). The bucket is shared across user, company, plugin
-- and mcp uploads with mixed path prefixes, so write access is scoped to the
-- object owner (owner_id) rather than the first path segment.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_public_read'
  ) then
    create policy avatars_public_read on storage.objects
      for select using (bucket_id = 'avatars');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_authenticated_insert'
  ) then
    create policy avatars_authenticated_insert on storage.objects
      for insert to authenticated
      with check (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and policyname = 'avatars_authenticated_update'
  ) then
    create policy avatars_authenticated_update on storage.objects
      for update to authenticated
      using (bucket_id = 'avatars' and owner_id = (select auth.uid())::text)
      with check (bucket_id = 'avatars' and owner_id = (select auth.uid())::text);
  end if;
end$$;
