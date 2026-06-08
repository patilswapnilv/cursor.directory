"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "./ui/button";

const HIDDEN_PATHS = ["/login", "/auth"];

export function JoinCTA() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsSignedIn(!!data.session);
    });
  }, []);

  // Renders nothing until the client session check resolves, so the
  // pathname-reading content below never runs during prerendering
  // (usePathname is runtime data under Cache Components).
  if (isSignedIn !== false) return null;

  return <JoinCTAContent />;
}

function JoinCTAContent() {
  const pathname = usePathname();

  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) return null;

  return (
    <div className="border-t border-border">
      <div className="mx-auto max-w-[1300px] px-4 py-20 md:px-6">
        <div className="flex flex-col items-center text-center">
          <h2 className="marketing-page-title mb-4">Join the community</h2>
          <p className="marketing-copy mb-8 max-w-md">
            Sign in to submit plugins, star your favorites, and connect with
            other developers.
          </p>
          <Link href="/login">
            <Button size="lg" className="rounded-full px-8">
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
