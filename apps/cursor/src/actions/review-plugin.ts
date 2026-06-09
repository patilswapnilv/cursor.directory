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
