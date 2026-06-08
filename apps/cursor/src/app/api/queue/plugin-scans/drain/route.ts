import { revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import {
  archivePluginScan,
  PLUGIN_SCAN_QUEUE,
  readNextPluginScan,
} from "@/lib/plugins/queue";
import {
  FatalScanError,
  markScanFailed,
  runPluginScan,
} from "@/lib/plugins/scan";

// Vercel max for Pro / Enterprise + Fluid Compute (default since 2025) is 800s.
// Source: https://vercel.com/docs/functions/configuring-functions/duration
//
// The `Agent.prompt` step can take 1–3 minutes for a typical plugin; the repo
// archive download is bounded by REPO_ARCHIVE_MAX_BYTES and a rate-limit
// retry budget inside scan.ts. 800s gives us generous headroom for the
// worst-case agent run.
export const maxDuration = 800;

/**
 * Scan outcomes mutate plugin rows (scan_status, flags), so cached plugin
 * reads must be refreshed. All plugin cache entries carry the `plugins` tag.
 */
function invalidatePluginCaches() {
  revalidateTag("plugins", "max");
}

// Visibility timeout: how long the message is invisible to other consumers
// after a successful `read`. Set comfortably longer than `maxDuration` so we
// can never hand the same message to a second drain invocation while the
// first one is still running.
const VT_SECONDS = 900;

// Bury after this many delivery attempts. With per-cron `n=1` and a 1-min
// schedule, this means a poisonous message stays in the queue for ~5 min
// after `read_ct=1` (we only see read_ct on the next read after the VT
// expires) before we mark the plugin errored and stop retrying.
const MAX_ATTEMPTS = 5;

function logInfo(msg: string, meta?: Record<string, unknown>) {
  console.log(`[scan-drain] ${msg}${meta ? ` ${JSON.stringify(meta)}` : ""}`);
}

function logError(msg: string, err: unknown) {
  const detail =
    err instanceof Error
      ? { name: err.name, message: err.message, stack: err.stack }
      : { value: String(err) };
  console.error(`[scan-drain] ${msg}`, detail);
}

export async function GET(request: NextRequest) {
  const unauthorized = requireCronAuth(request);
  if (unauthorized) return unauthorized;

  let msg: Awaited<ReturnType<typeof readNextPluginScan>>;
  try {
    msg = await readNextPluginScan(VT_SECONDS);
  } catch (err) {
    logError("readNextPluginScan failed", err);
    return NextResponse.json(
      { ok: false, error: "queue_read_failed" },
      { status: 500 },
    );
  }

  if (!msg) {
    return NextResponse.json({
      ok: true,
      queue: PLUGIN_SCAN_QUEUE,
      drained: 0,
    });
  }

  const { msg_id, read_ct, message } = msg;
  const pluginId = message.plugin_id;

  if (!pluginId || typeof pluginId !== "string") {
    // Malformed payload — archive it so it doesn't keep getting retried.
    logError(
      "malformed message; archiving",
      new Error(JSON.stringify(message)),
    );
    await archivePluginScan(msg_id).catch((err) =>
      logError("archive (malformed) failed", err),
    );
    return NextResponse.json(
      { ok: false, archived: msg_id, reason: "malformed_message" },
      { status: 200 },
    );
  }

  if (read_ct > MAX_ATTEMPTS) {
    logInfo("exceeded MAX_ATTEMPTS; burying", {
      pluginId,
      msg_id,
      read_ct,
      max: MAX_ATTEMPTS,
    });
    await markScanFailed(pluginId, `Exceeded ${MAX_ATTEMPTS} scan attempts`);
    await archivePluginScan(msg_id);
    invalidatePluginCaches();
    return NextResponse.json({
      ok: true,
      buried: pluginId,
      msg_id,
      read_ct,
    });
  }

  logInfo("processing", { pluginId, msg_id, read_ct });

  try {
    await runPluginScan(pluginId);
    await archivePluginScan(msg_id);
    invalidatePluginCaches();
    logInfo("scanned ok", { pluginId, msg_id });
    return NextResponse.json({ ok: true, scanned: pluginId, msg_id });
  } catch (err) {
    if (err instanceof FatalScanError) {
      // runPluginScan already wrote `scan_status='error'` via its compensation
      // path. Archive so the message doesn't get retried.
      logError("fatal; archiving", err);
      await archivePluginScan(msg_id).catch((archiveErr) =>
        logError("archive (fatal) failed", archiveErr),
      );
      invalidatePluginCaches();
      return NextResponse.json(
        {
          ok: false,
          fatal: true,
          pluginId,
          msg_id,
          error: err.message,
        },
        { status: 200 },
      );
    }

    // Retryable: do NOT archive. The pgmq visibility timeout (VT_SECONDS)
    // expires and the next cron tick re-reads the message with read_ct + 1.
    logError("retryable; leaving message for VT to expire", err);
    return NextResponse.json(
      {
        ok: false,
        retryable: true,
        pluginId,
        msg_id,
        read_ct,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
