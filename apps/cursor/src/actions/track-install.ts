"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod";
import { installGlobalLimit, installPerPluginLimit } from "@/lib/rate-limit";
import { createClient as createAdminClient } from "@/utils/supabase/admin-client";
import { actionClient } from "./safe-action";

export type TrackInstallResult =
  | { tracked: true }
  | { tracked: false; rateLimited: true };

export const trackInstallAction = actionClient
  .metadata({
    actionName: "track-install",
  })
  .schema(
    z.object({
      pluginId: z.string().uuid(),
      slug: z.string(),
    }),
  )
  .action(async ({ parsedInput: { pluginId, slug } }) => {
    const [global, perPlugin] = await Promise.all([
      installGlobalLimit(),
      installPerPluginLimit(pluginId),
    ]);

    if (!global.success || !perPlugin.success) {
      return { tracked: false, rateLimited: true } satisfies TrackInstallResult;
    }

    const admin = await createAdminClient();

    await admin.rpc("increment_install_count", {
      plugin_id_input: pluginId,
    });

    // Counters tolerate stale-while-revalidate: serve the cached leaderboard
    // and plugin page instantly while fresh counts regenerate in the
    // background (avoids a blocking re-render per install).
    revalidateTag("plugins", "max");
    revalidateTag(`plugin-${slug}`, "max");

    return { tracked: true } satisfies TrackInstallResult;
  });
