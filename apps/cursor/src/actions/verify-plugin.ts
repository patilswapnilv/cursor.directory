"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/admin-client";
import { ActionError, adminActionClient } from "./safe-action";

const pluginIdSchema = z.object({ pluginId: z.string().uuid() });

export const setPluginVerifiedAction = adminActionClient
  .metadata({ actionName: "set-plugin-verified" })
  .schema(z.object({ pluginId: z.string().uuid(), verified: z.boolean() }))
  .action(async ({ parsedInput: { pluginId, verified }, ctx: { userId } }) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("plugins")
      .update({
        verified,
        verified_at: verified ? new Date().toISOString() : null,
        verified_by: verified ? userId : null,
        // Approving or unverifying always clears any open request.
        verification_requested_at: null,
      })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (error || !data) {
      throw new ActionError(
        `Failed to update verified status: ${error?.message ?? "not found"}`,
      );
    }

    revalidatePath("/admin/plugins");
    revalidatePath("/");
    revalidatePath(`/plugins/${data.slug}`);
    return { success: true };
  });

export const dismissVerificationRequestAction = adminActionClient
  .metadata({ actionName: "dismiss-verification-request" })
  .schema(pluginIdSchema)
  .action(async ({ parsedInput: { pluginId } }) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("plugins")
      .update({ verification_requested_at: null })
      .eq("id", pluginId)
      .select("slug")
      .single();

    if (error || !data) {
      throw new ActionError(
        `Failed to dismiss request: ${error?.message ?? "not found"}`,
      );
    }

    revalidatePath("/admin/plugins");
    revalidatePath(`/plugins/${data.slug}`);
    return { success: true };
  });
