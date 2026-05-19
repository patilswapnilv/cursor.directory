"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { ActionError, authActionClient } from "./safe-action";

export const upsertCompanyAction = authActionClient
  .metadata({
    actionName: "upsert-company",
  })
  .schema(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      image: z.string().url().nullable(),
      slug: z.string().optional(),
      location: z.string().nullable(),
      bio: z.string().nullable(),
      website: z.string().nullable(),
      social_x_link: z.string().nullable(),
      is_public: z.boolean(),
      redirect: z.boolean().optional(),
    }),
  )
  .action(
    async ({
      parsedInput: {
        id,
        name,
        image,
        slug,
        location,
        bio,
        website,
        social_x_link,
        is_public,
        redirect: shouldRedirect,
      },
      ctx: { userId },
    }) => {
      const supabase = await createClient();

      // Only treat the request as an edit when a row with the provided id
      // already exists. The form always generates a client-side nanoid for new
      // companies, so the presence of `id` alone does not imply an edit.
      if (id) {
        const { data: existing } = await supabase
          .from("companies")
          .select("id, owner_id")
          .eq("id", id)
          .maybeSingle();

        if (existing && existing.owner_id !== userId) {
          throw new ActionError(
            "You don't have permission to edit this company",
          );
        }
      }

      const { data, error } = await supabase
        .from("companies")
        .upsert(
          {
            id: id ?? undefined,
            name,
            image,
            location,
            slug: slug ?? undefined,
            bio,
            website,
            social_x_link,
            public: is_public,
            owner_id: userId,
          },
          {
            onConflict: "id",
          },
        )
        .select("id, slug")
        .single();

      if (error) {
        throw new ActionError(error.message);
      }

      if (shouldRedirect) {
        redirect(`/c/${data?.slug}`);
      }

      return data;
    },
  );
