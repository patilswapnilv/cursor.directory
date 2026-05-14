"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useMemo } from "react";
import type { LeaderboardItem } from "@/components/plugins/plugin-leaderboard";
import { PluginLeaderboard } from "@/components/plugins/plugin-leaderboard";
import { GlobalSearchInput } from "./global-search-input";
import { HeroTitle } from "./hero-title";

export function Startpage({
  leaderboardItems,
  totalUsers,
}: {
  leaderboardItems: LeaderboardItem[];
  totalUsers: number;
}) {
  const [search] = useQueryState("q", { defaultValue: "" });

  const isSearching = search.trim().length > 0;

  const fuse = useMemo(
    () =>
      new Fuse(leaderboardItems, {
        keys: [
          { name: "name", weight: 3 },
          { name: "slug", weight: 1.5 },
          { name: "author", weight: 1 },
          { name: "description", weight: 0.5 },
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [leaderboardItems],
  );

  const visibleItems = useMemo(() => {
    if (!isSearching) return leaderboardItems;
    return fuse.search(search).map((r) => r.item);
  }, [isSearching, fuse, search, leaderboardItems]);

  return (
    <div className="page-shell pb-24 pt-28 md:pt-36">
      <div className="relative mx-auto flex w-full flex-col gap-6">
        <div>
          <HeroTitle totalUsers={totalUsers} />

          <div className="mx-auto mb-20 w-full max-w-[720px]">
            <GlobalSearchInput />
          </div>

          {visibleItems.length > 0 ? (
            <div className="mx-auto mb-14 w-full max-w-[880px]">
              <PluginLeaderboard items={visibleItems} />
            </div>
          ) : (
            <div className="mt-16 flex flex-col items-center">
              <p className="text-sm text-muted-foreground">
                No plugins found for &quot;{search}&quot;
              </p>
              <Link
                href="/plugins/new"
                className="mt-2 border-b border-dashed border-input text-sm text-muted-foreground hover:text-foreground"
              >
                Submit a plugin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
