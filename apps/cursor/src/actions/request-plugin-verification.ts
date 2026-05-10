"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/admin-client";
import { ActionError, authActionClient } from "./safe-action";

export const requestPluginVerificationAction = authActionClient
  .metadata({ actionName: "request-plugin-verification" })
  .schema(z.object({ pluginId: z.string().uuid() }))
  .action(async ({ parsedInput: { pluginId }, ctx: { userId } }) => {
    const supabase = await createClient();

    const { data: plugin, error: readErr } = await supabase
      .from("plugins")
      .select("id, slug, owner_id, verified, verification_requested_at")
      .eq("id", pluginId)
      .single();

    if (readErr || !plugin) {
      throw new ActionError("Plugin not found");
    }
    if (plugin.owner_id !== userId) {
      throw new ActionError("You don't own this plugin");
    }
    if (plugin.verified) {
      throw new ActionError("Plugin is already verified");
    }
    if (plugin.verification_requested_at) {
      throw new ActionError("Verification already requested");
    }

    const { error } = await supabase
      .from("plugins")
      .update({ verification_requested_at: new Date().toISOString() })
      .eq("id", pluginId);

    if (error) {
      throw new ActionError(`Failed to submit request: ${error.message}`);
    }

    revalidatePath("/admin/plugins");
    revalidatePath(`/plugins/${plugin.slug}`);
    return { success: true };
  });
