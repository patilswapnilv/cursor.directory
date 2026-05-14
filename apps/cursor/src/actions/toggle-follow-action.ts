"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { authActionClient } from "./safe-action";

export const toggleFollowAction = authActionClient
  .metadata({
    actionName: "toggle-follow",
  })
  .schema(
    z.object({
      action: z.enum(["follow", "unfollow"]),
      userId: z.string().uuid(),
      slug: z.string(),
    }),
  )
  .action(
    async ({
      parsedInput: { userId, action, slug },
      ctx: { userId: currentUserId },
    }) => {
      const supabase = await createClient();

      if (action === "follow") {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: currentUserId, following_id: userId });

        if (error) {
          throw new Error(error.message);
        }

        revalidatePath(`/u/${slug}`);
        return;
      }

      if (action === "unfollow") {
        await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", userId);
      }

      revalidatePath(`/u/${slug}`);
    },
  );
