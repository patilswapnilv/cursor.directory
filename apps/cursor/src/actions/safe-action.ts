import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { z } from "zod";
import { isAdmin } from "@/utils/admin";
import { getSession } from "@/utils/supabase/auth";

export class ActionError extends Error {}

// Base client.
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof ActionError) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      actionName: z.string(),
    });
  },
  // Define logging middleware.
}).use(async ({ next, clientInput, metadata }) => {
  const result = await next();

  console.log("Result ->", result);
  console.log("Client input ->", clientInput);
  console.log("Metadata ->", metadata);

  return result;
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession();

  if (!session) {
    throw new Error("Session not found!");
  }

  return next({
    ctx: {
      userId: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata.name,
    },
  });
});

export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (!isAdmin(ctx.userId)) {
    throw new ActionError("Unauthorized: admin access required");
  }

  return next({ ctx });
});
