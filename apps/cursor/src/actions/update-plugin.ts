"use server";

import { revalidatePath } from "next/cache";
import { start } from "workflow/api";
import { z } from "zod";
import { pluginScanLimit } from "@/lib/rate-limit";
import { createClient } from "@/utils/supabase/admin-client";
import { scanPluginWorkflow } from "@/workflows/scan-plugin";
import { ActionError, authActionClient } from "./safe-action";

const componentSchema = z.object({
  type: z.enum([
    "rule",
    "mcp_server",
    "skill",
    "agent",
    "hook",
    "lsp_server",
    "command",
  ]),
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

type ComponentInput = z.infer<typeof componentSchema>;

type ExistingComponent = {
  type: string;
  name: string;
  slug: string;
  description: string | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  sort_order: number;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Only fields that affect the install payload — cosmetic edits to name,
// description, or sort_order must not trigger a rescan.
function fingerprintComponent(c: {
  type: string;
  slug?: string | null;
  name: string;
  content?: string | null;
  metadata?: Record<string, unknown> | null;
}): string {
  const slug = c.slug || slugify(c.name);
  return JSON.stringify({
    type: c.type,
    slug,
    content: c.content ?? "",
    metadata: c.metadata ?? {},
  });
}

function installRelevantChanged(
  prevComponents: ExistingComponent[],
  prevRepository: string | null,
  nextComponents: ComponentInput[],
  nextRepository: string | null,
): boolean {
  if ((prevRepository ?? null) !== (nextRepository ?? null)) {
    return true;
  }

  if (prevComponents.length !== nextComponents.length) {
    return true;
  }

  const prevSorted = [...prevComponents]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(fingerprintComponent)
    .sort();
  const nextSorted = nextComponents.map(fingerprintComponent).sort();

  for (let i = 0; i < prevSorted.length; i++) {
    if (prevSorted[i] !== nextSorted[i]) return true;
  }
  return false;
}

export const updatePluginAction = authActionClient
  .metadata({
    actionName: "update-plugin",
  })
  .schema(
    z.object({
      id: z.string().uuid(),
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
      logo: z.string().nullable().optional(),
      repository: z.string().url().nullable().optional(),
      homepage: z.string().url().nullable().optional(),
      keywords: z.array(z.string()).optional(),
      components: z
        .array(componentSchema)
        .min(1, "At least one component is required"),
    }),
  )
  .action(
    async ({
      parsedInput: {
        id,
        name,
        description,
        logo,
        repository,
        homepage,
        keywords,
        components,
      },
      ctx: { userId },
    }) => {
      const supabase = await createClient();

      const { data: existing, error: fetchError } = await supabase
        .from("plugins")
        .select(
          "id, owner_id, slug, repository, active, plugin_components(type, name, slug, description, content, metadata, sort_order)",
        )
        .eq("id", id)
        .single();

      if (fetchError || !existing) {
        throw new ActionError("Plugin not found.");
      }

      if (existing.owner_id !== userId) {
        throw new ActionError(
          "You do not have permission to edit this plugin.",
        );
      }

      const { success } = await pluginScanLimit(userId);
      if (!success) {
        throw new ActionError(
          "Too many plugin updates in the last hour. Please try again later.",
        );
      }

      const prevComponents = (existing.plugin_components ??
        []) as ExistingComponent[];

      const installChanged = installRelevantChanged(
        prevComponents,
        existing.repository ?? null,
        components,
        repository ?? null,
      );

      const shouldRescan = installChanged;
      const updatePayload: Record<string, unknown> = {
        name,
        description,
        logo: logo || null,
        repository: repository || null,
        homepage: homepage || null,
        keywords: keywords || [],
      };

      if (shouldRescan && existing.active) {
        updatePayload.active = false;
        updatePayload.scan_status = "pending";
        updatePayload.flag_summary = null;
        updatePayload.flag_reasons = [];
        updatePayload.flag_severity = null;
        updatePayload.flagged_at = null;
      }

      const { error: updateError } = await supabase
        .from("plugins")
        .update(updatePayload)
        .eq("id", id);

      if (updateError) {
        if (updateError.code === "23505") {
          throw new ActionError(
            "A plugin with this name already exists. Please choose a different name.",
          );
        }
        throw new ActionError(
          `Failed to update plugin: ${updateError.message}`,
        );
      }

      const { error: deleteError } = await supabase
        .from("plugin_components")
        .delete()
        .eq("plugin_id", id);

      if (deleteError) {
        throw new ActionError(
          `Failed to update components: ${deleteError.message}`,
        );
      }

      const componentRows = components.map((comp, i) => ({
        plugin_id: id,
        type: comp.type,
        name: comp.name,
        slug: comp.slug || slugify(comp.name),
        description: comp.description || null,
        content: comp.content || null,
        metadata: comp.metadata || {},
        sort_order: i,
      }));

      const { error: compError } = await supabase
        .from("plugin_components")
        .insert(componentRows);

      if (compError) {
        throw new ActionError(
          `Failed to save plugin components: ${compError.message}`,
        );
      }

      if (shouldRescan) {
        try {
          await start(scanPluginWorkflow, [id]);
        } catch (workflowError) {
          console.error("Failed to enqueue scan workflow", workflowError);
        }
      }

      revalidatePath("/");
      revalidatePath(`/plugins/${existing.slug}`);

      return {
        slug: existing.slug,
        rescanQueued: shouldRescan,
      };
    },
  );
