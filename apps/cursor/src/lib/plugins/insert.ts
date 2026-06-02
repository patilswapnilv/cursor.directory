/**
 * Pure plugin insert.
 *
 * Wrapped by [`createPluginAction`](src/actions/create-plugin.ts) for the auth'd
 * user-submission path and by the seed scripts for bulk import. Server actions
 * stay responsible for auth, rate-limiting, and `revalidatePath` — this lib
 * only touches the database and (optionally) enqueues the security scan.
 */

import { enqueuePluginScan, kickDrainAfterResponse } from "@/lib/plugins/queue";
import { resolveComponentSlug } from "@/lib/slug";
import { createClient } from "@/utils/supabase/admin-client";

type ComponentInput = {
  type: string;
  name: string;
  slug?: string;
  description?: string | null;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type InsertPluginInput = {
  name: string;
  description: string;
  logo?: string | null;
  repository?: string | null;
  homepage?: string | null;
  license?: string | null;
  keywords?: string[];
  author_name?: string | null;
  author_url?: string | null;
  author_avatar?: string | null;
  components: ComponentInput[];
};

export type InsertPluginOptions = {
  ownerId: string | null;
  /** Free-form provenance string, e.g. 'user', 'seed:cursor-spec'. */
  source: string;
  /** GitHub's stable numeric repo id; enables idempotent re-imports. */
  githubRepoId?: number | null;
  /**
   * When true, publish immediately as `active=true, scan_status='unscanned'`
   * and skip the security scan. Used for the curated bulk seed.
   *
   * When false (default for user submissions): insert as `active=false,
   * scan_status='pending'` and enqueue the scan via `enqueuePluginScan`.
   */
  skipScan?: boolean;
};

export class InsertPluginError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "duplicate_name"
      | "duplicate_repo"
      | "components_failed"
      | "insert_failed",
  ) {
    super(message);
    this.name = "InsertPluginError";
  }
}

export async function insertPlugin(
  input: InsertPluginInput,
  options: InsertPluginOptions,
): Promise<{ id: string; slug: string }> {
  const supabase = await createClient();

  const skipScan = options.skipScan === true;

  const { data: plugin, error: pluginError } = await supabase
    .from("plugins")
    .insert({
      name: input.name,
      description: input.description,
      logo: input.logo || null,
      repository: input.repository || null,
      homepage: input.homepage || null,
      license: input.license || null,
      keywords: input.keywords || [],
      author_name: input.author_name || null,
      author_url: input.author_url || null,
      author_avatar: input.author_avatar || null,
      owner_id: options.ownerId,
      active: skipScan,
      plan: "standard",
      scan_status: skipScan ? "unscanned" : "pending",
      discovery_source: options.source,
      github_repo_id: options.githubRepoId ?? null,
    })
    .select("id, slug")
    .single();

  if (pluginError) {
    if (pluginError.code === "23505") {
      // Distinguish repo-id collision (idempotent re-run) from name collision
      // so callers can decide whether it's an error or expected.
      const detail = pluginError.message?.toLowerCase() ?? "";
      if (detail.includes("github_repo_id")) {
        throw new InsertPluginError(
          "A plugin with this GitHub repository already exists.",
          "duplicate_repo",
        );
      }
      throw new InsertPluginError(
        "A plugin with this name already exists.",
        "duplicate_name",
      );
    }
    throw new InsertPluginError(
      `Failed to create plugin: ${pluginError.message}`,
      "insert_failed",
    );
  }

  const componentRows = input.components.map((comp, i) => ({
    plugin_id: plugin.id,
    type: comp.type,
    name: comp.name,
    slug: resolveComponentSlug(comp),
    description: comp.description || null,
    content: comp.content || null,
    metadata: comp.metadata || {},
    sort_order: i,
  }));

  const { error: compError } = await supabase
    .from("plugin_components")
    .insert(componentRows);

  if (compError) {
    await supabase.from("plugins").delete().eq("id", plugin.id);
    throw new InsertPluginError(
      `Failed to save plugin components: ${compError.message}`,
      "components_failed",
    );
  }

  if (!skipScan) {
    try {
      await enqueuePluginScan(plugin.id);
      kickDrainAfterResponse();
    } catch (queueError) {
      // Don't fail the insert if the queue is unreachable — the
      // recover-stuck-scans cron will re-enqueue any rows left at
      // scan_status='pending' after 15 min.
      console.error("Failed to enqueue plugin scan", queueError);
    }
  }

  return { id: plugin.id, slug: plugin.slug };
}
