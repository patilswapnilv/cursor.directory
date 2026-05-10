"use client";

import { GithubSignin } from "./github-signin";
import { GoogleSignin } from "./google-signin";

export function Login({ redirectTo }: { redirectTo?: string }) {
  return (
    <div>
      <h1 className="text-xl font-medium tracking-tight">Join the community</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Sign in to submit plugins, star your favorites, and connect with
        thousands of developers building with Cursor.
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <GithubSignin redirectTo={redirectTo} />
        <GoogleSignin redirectTo={redirectTo} />
      </div>
    </div>
  );
}
