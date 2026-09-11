"use server";

import { revalidatePath, updateTag } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/admin-client";
import { ActionError, adminActionClient } from "./safe-action";

export const approvePluginAction = adminActionClient
  .metadata({ actionName: "approve-plugin" })
  .schema(z.object({ pluginId: z.string().uuid() }))
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("plugins")
      .update({ active: true })
      .eq("id", pluginId);

    if (error) {
      throw new ActionError(`Failed to approve plugin: ${error.message}`);
    }

    const { data: plugin } = await supabase
      .from("plugins")
      .select("slug")
      .eq("id", pluginId)
      .single();

    revalidatePath("/admin/plugins");
    updateTag("plugins");

    if (plugin?.slug) {
      updateTag(`plugin-${plugin.slug}`);
    }

    return { success: true };
  });

/**
 * Admin counterpart to the owner's unpublish: hides the plugin from the
 * directory without blocking it, so the owner (or an admin) can re-publish.
 * Use `confirmFlagAction` instead when the plugin should stay down.
 */
export const unpublishPluginAction = adminActionClient
  .metadata({ actionName: "unpublish-plugin" })
  .schema(z.object({ pluginId: z.string().uuid() }))
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { data: plugin, error } = await supabase
      .from("plugins")
      .update({ active: false })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (error || !plugin) {
      throw new ActionError(
        `Failed to unpublish plugin: ${error?.message ?? "not found"}`,
      );
    }

    revalidatePath("/admin/plugins");
    updateTag("plugins");
    updateTag(`plugin-${plugin.slug}`);

    return { success: true };
  });

export const declinePluginAction = adminActionClient
  .metadata({ actionName: "decline-plugin" })
  .schema(z.object({ pluginId: z.string().uuid() }))
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { error } = await supabase
      .from("plugins")
      .delete()
      .eq("id", pluginId);

    if (error) {
      throw new ActionError(`Failed to decline plugin: ${error.message}`);
    }

    revalidatePath("/admin/plugins");
    updateTag("plugins");

    return { success: true };
  });
