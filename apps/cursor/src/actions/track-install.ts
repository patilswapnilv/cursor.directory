"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import {
  installGlobalRatelimit,
  installPerPluginRatelimit,
} from "@/lib/rate-limit";
import { createClient as createAdminClient } from "@/utils/supabase/admin-client";
import { ActionError, actionClient } from "./safe-action";

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
    const headersList = await headers();
    const ip =
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "unknown";

    const [global, perPlugin] = await Promise.all([
      installGlobalRatelimit.limit(ip),
      installPerPluginRatelimit.limit(`${ip}:${pluginId}`),
    ]);

    if (!global.success || !perPlugin.success) {
      throw new ActionError("Rate limit exceeded. Please try again later.");
    }

    const admin = await createAdminClient();

    await admin.rpc("increment_install_count", {
      plugin_id_input: pluginId,
    });

    revalidatePath("/");
    revalidatePath(`/plugins/${slug}`);
  });
