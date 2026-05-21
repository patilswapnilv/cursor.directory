import { type NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { enqueuePluginScan } from "@/lib/plugins/queue";
import { createClient } from "@/utils/supabase/admin-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Retry plugins that have been sitting in pending/scanning longer than this.
// 15 min matches the threshold in getStuckScans() so the admin "Stuck" tab
// and this cron see the same set of rows.
const STALE_AFTER_MS = 15 * 60 * 1000;

// Hard cap per cron tick. Each enqueuePluginScan() is cheap (just a pgmq.send)
// but we don't want to flood the queue if a backlog builds up.
const MAX_RETRIES_PER_RUN = 25;

export async function GET(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const supabase = await createClient();
    const cutoff = new Date(Date.now() - STALE_AFTER_MS).toISOString();

    const { data: stuck, error } = await supabase
      .from("plugins")
      .select("id, slug, scan_status")
      .in("scan_status", ["pending", "scanning"])
      .lt("updated_at", cutoff)
      .order("updated_at", { ascending: true })
      .limit(MAX_RETRIES_PER_RUN);

    if (error) {
      throw new Error(`Failed to query stuck plugins: ${error.message}`);
    }

    const results: Array<{
      id: string;
      slug: string;
      ok: boolean;
      error?: string;
    }> = [];

    for (const plugin of stuck ?? []) {
      // Reset back to pending so the worker's loadPlugin → markScanning
      // transition is idempotent (the prevActive snapshot is recomputed).
      if (plugin.scan_status === "scanning") {
        await supabase
          .from("plugins")
          .update({ scan_status: "pending" })
          .eq("id", plugin.id);
      }

      try {
        await enqueuePluginScan(plugin.id);
        results.push({ id: plugin.id, slug: plugin.slug, ok: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
          `recover-stuck-scans: failed to enqueue ${plugin.slug}`,
          message,
        );
        results.push({
          id: plugin.id,
          slug: plugin.slug,
          ok: false,
          error: message,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      considered: stuck?.length ?? 0,
      retried: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("recover-stuck-scans failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
