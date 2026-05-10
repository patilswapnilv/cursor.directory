"use server";

import { z } from "zod";
import { GitHubParseError, parseGitHubPlugin } from "@/lib/github-plugin/parse";
import { ActionError, authActionClient } from "./safe-action";

export const parseGitHubPluginAction = authActionClient
  .metadata({ actionName: "parse-github-plugin" })
  .schema(
    z.object({
      url: z.string().url("Please enter a valid GitHub URL"),
    }),
  )
  .action(async ({ parsedInput: { url } }) => {
    try {
      return await parseGitHubPlugin(url);
    } catch (err) {
      if (err instanceof GitHubParseError) {
        throw new ActionError(err.message);
      }
      throw err;
    }
  });
