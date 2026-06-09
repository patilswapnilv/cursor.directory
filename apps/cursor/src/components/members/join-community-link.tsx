"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { isAuthenticated } from "@/utils/supabase/client-session";

/**
 * Signed-out CTA on the (fully cached) members page. The session check is a
 * client-side cookie sniff so the page itself never reads request data —
 * the link appears after hydration for signed-out visitors only.
 */
export function JoinCommunityLink() {
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    setSignedOut(!isAuthenticated());
  }, []);

  if (!signedOut) return null;

  return (
    <Link
      href="/login"
      className="flex h-10 flex-shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-cursor transition-colors hover:bg-accent"
    >
      Join the community
    </Link>
  );
}
