"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { InsertPluginError, insertPlugin } from "@/lib/plugins/insert";
import { pluginScanLimit } from "@/lib/rate-limit";
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

export const createPluginAction = authActionClient
  .metadata({
    actionName: "create-plugin",
  })
  .schema(
    z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
      logo: z.string().nullable().optional(),
      repository: z.string().url().nullable().optional(),
      homepage: z.string().url().nullable().optional(),
      keywords: z.array(z.string()).optional(),
      githubRepoId: z.number().int().positive().nullable().optional(),
      components: z
        .array(componentSchema)
        .min(1, "At least one component is required"),
    }),
  )
  .action(
    async ({
      parsedInput: {
        name,
        description,
        logo,
        repository,
        homepage,
        keywords,
        githubRepoId,
        components,
      },
      ctx: { userId },
    }) => {
      const { success } = await pluginScanLimit(userId);
      if (!success) {
        throw new ActionError(
          "Too many plugin submissions in the last hour. Please try again later.",
        );
      }

      let result: { id: string; slug: string };
      try {
        result = await insertPlugin(
          {
            name,
            description,
            logo,
            repository,
            homepage,
            keywords,
            components,
          },
          {
            ownerId: userId,
            source: "user",
            skipScan: false,
            githubRepoId: githubRepoId ?? null,
          },
        );
      } catch (err) {
        if (err instanceof InsertPluginError) {
          if (err.code === "duplicate_name" || err.code === "duplicate_repo") {
            throw new ActionError(
              "A plugin with this name or repository already exists. Please choose a different name or repository.",
            );
          }
          throw new ActionError(err.message);
        }
        throw err;
      }

      revalidatePath("/");

      return { slug: result.slug };
    },
  );
