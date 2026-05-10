"use client";

import { formatNumber } from "@/utils/format";
import Link from "next/link";

const linkClass =
  "border-b border-dashed border-input text-foreground";

export function HeroTitle({ totalUsers }: { totalUsers: number }) {
  return (
    <div className="mb-14 text-center">
      <h1 className="marketing-hero-title mx-auto mb-5 max-w-[980px] text-balance text-foreground">
        Explore what the community is building
      </h1>

      <p className="marketing-copy mx-auto max-w-[760px] text-balance">
        <Link href="/plugins" className={linkClass}>
          Plugins
        </Link>{" "}
        and{" "}
        <Link href="/members" className={linkClass}>
          {formatNumber(totalUsers)}+ developers
        </Link>{" "}
        building with Cursor.
      </p>
    </div>
  );
}
