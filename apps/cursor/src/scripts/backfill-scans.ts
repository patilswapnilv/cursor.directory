/**
 * One-shot backfill: enqueue a security scan for every legacy `active=false`
 * plugin that hasn't been scanned yet. Run after applying the schema migration
 * with:
 *
 *   bun run --env-file=.env.local apps/cursor/src/scripts/backfill-scans.ts
 *
 * Idempotent — already-scanned rows are skipped via the `scan_status='pending'`
 * filter, so re-running only picks up newly-pending rows.
 */

import { start } from "workflow/api";
import { createClient } from "@/utils/supabase/admin-client";
import { scanPluginWorkflow } from "@/workflows/scan-plugin";

async function main() {
  const supabase = await createClient();
  const PAGE_SIZE = 50;
  let from = 0;
  let total = 0;

  while (true) {
    const { data, error } = await supabase
      .from("plugins")
      .select("id, slug")
      .eq("active", false)
      .eq("scan_status", "pending")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      console.error("Failed to read pending plugins:", error.message);
      process.exit(1);
    }
    if (!data || data.length === 0) break;

    for (const row of data) {
      try {
        const run = await start(scanPluginWorkflow, [row.id]);
        console.log(`enqueued ${row.slug} (${row.id}) -> run ${run.runId}`);
        total += 1;
      } catch (err) {
        console.error(
          `failed to enqueue ${row.slug}:`,
          err instanceof Error ? err.message : err,
        );
      }
      // Tiny delay to be polite to the workflow API.
      await new Promise((r) => setTimeout(r, 50));
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log(`Done. Enqueued ${total} scan(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
