"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { enqueuePluginScan, kickDrainAfterResponse } from "@/lib/plugins/queue";
import { createClient } from "@/utils/supabase/admin-client";
import { ActionError, adminActionClient } from "./safe-action";

const pluginIdSchema = z.object({ pluginId: z.string().uuid() });

export const approveFlaggedPluginAction = adminActionClient
  .metadata({ actionName: "approve-flagged-plugin" })
  .schema(pluginIdSchema)
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { data: plugin, error } = await supabase
      .from("plugins")
      .update({
        active: true,
        scan_status: "safe",
        flag_summary: null,
        flag_reasons: [],
        flag_severity: null,
        flagged_at: null,
        permanently_blocked: false,
      })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (error || !plugin) {
      throw new ActionError(
        `Failed to approve flagged plugin: ${error?.message ?? "not found"}`,
      );
    }

    revalidatePath("/admin/plugins");
    updateTag("plugins");
    updateTag(`plugin-${plugin.slug}`);
    return { success: true };
  });

export const confirmFlagAction = adminActionClient
  .metadata({ actionName: "confirm-flag" })
  .schema(pluginIdSchema)
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { data: plugin, error } = await supabase
      .from("plugins")
      .update({
        active: false,
        scan_status: "flagged",
        permanently_blocked: true,
      })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (error || !plugin) {
      throw new ActionError(
        `Failed to confirm flag: ${error?.message ?? "not found"}`,
      );
    }

    revalidatePath("/admin/plugins");
    updateTag("plugins");
    updateTag(`plugin-${plugin.slug}`);
    return { success: true };
  });

export const rescanPluginAction = adminActionClient
  .metadata({ actionName: "rescan-plugin" })
  .schema(pluginIdSchema)
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { data: plugin, error: resetError } = await supabase
      .from("plugins")
      .update({ scan_status: "pending" })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (resetError || !plugin) {
      throw new ActionError(
        `Failed to reset scan state: ${resetError?.message ?? "not found"}`,
      );
    }

    // The status reset must reach cached readers (detail banner, leaderboard)
    // right away, so invalidate before enqueueing — a queue failure must not
    // leave cached views showing the stale status when the row is already
    // pending. The drain route only invalidates again once the scan ends.
    revalidatePath("/admin/plugins");
    updateTag("plugins");
    updateTag(`plugin-${plugin.slug}`);

    try {
      await enqueuePluginScan(pluginId);
      kickDrainAfterResponse();
    } catch (err) {
      throw new ActionError(
        `Failed to enqueue scan: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    return { success: true };
  });
