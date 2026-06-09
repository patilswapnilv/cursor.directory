"use client";

import Link from "next/link";
import { formatCount } from "@/lib/utils";

const linkClass = "border-b border-dashed border-input text-foreground";

export function HeroTitle({ totalUsers }: { totalUsers: number }) {
  return (
    <div className="mb-14 text-center">
      <h1 className="marketing-hero-title mx-auto mb-5 max-w-[980px] text-balance text-foreground">
        Extend Cursor with community plugins.
      </h1>

      <p className="marketing-copy mx-auto max-w-[760px] text-balance">
        Discover and install plugins from{" "}
        <Link href="/members" className={linkClass}>
          {formatCount(totalUsers)}+ developers
        </Link>
        , ranked by what&rsquo;s trending.
      </p>
    </div>
  );
}
