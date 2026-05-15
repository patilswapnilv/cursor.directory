"use server";

import { revalidatePath } from "next/cache";
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
    revalidatePath("/");
    revalidatePath(`/plugins/${plugin.slug}`);
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
    revalidatePath("/");
    revalidatePath(`/plugins/${plugin.slug}`);
    return { success: true };
  });

export const rescanPluginAction = adminActionClient
  .metadata({ actionName: "rescan-plugin" })
  .schema(pluginIdSchema)
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { error: resetError } = await supabase
      .from("plugins")
      .update({ scan_status: "pending" })
      .eq("id", pluginId);

    if (resetError) {
      throw new ActionError(
        `Failed to reset scan state: ${resetError.message}`,
      );
    }

    try {
      await enqueuePluginScan(pluginId);
      kickDrainAfterResponse();
    } catch (err) {
      throw new ActionError(
        `Failed to enqueue scan: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    revalidatePath("/admin/plugins");
    return { success: true };
  });
