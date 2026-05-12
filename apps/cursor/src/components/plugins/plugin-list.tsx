"use client";

import Fuse from "fuse.js";
import { useQueryState } from "nuqs";
import { useCallback, useMemo, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils";
import { SearchInput } from "../search-input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PluginCard, type PluginCardData } from "./plugin-card";

const ITEMS_PER_PAGE = 36;

export function PluginList({
  plugins,
  tags,
}: {
  plugins: PluginCardData[];
  tags: string[];
}) {
  const [search] = useQueryState("q");
  const [selectedTag, setSelectedTag] = useQueryState("tag");
  const [sort, setSort] = useQueryState("sort");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const tabs = [
    { key: null, label: "All" },
    { key: "mcp", label: "MCPs" },
    { key: "rules", label: "Rules" },
  ] as const;

  const fuse = useMemo(
    () =>
      new Fuse(plugins, {
        keys: [
          { name: "name", weight: 3 },
          { name: "slug", weight: 1.5 },
          { name: "keywords", weight: 1.5 },
          { name: "description", weight: 0.5 },
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [plugins],
  );

  const filtered = useMemo(() => {
    let result = plugins;

    if (selectedTag === "mcp") {
      result = result.filter((p) => p.type === "mcp" || p.type === "both");
    } else if (selectedTag === "rules") {
      result = result.filter((p) => p.type === "rules" || p.type === "both");
    }

    if (search && search.length > 0) {
      const fuseResults = fuse.search(search);
      result = fuseResults
        .filter((r) => {
          if (selectedTag === "mcp")
            return r.item.type === "mcp" || r.item.type === "both";
          if (selectedTag === "rules")
            return r.item.type === "rules" || r.item.type === "both";
          return true;
        })
        .map((r) => r.item);
    }

    if (sort !== "recent") {
      result = [...result].sort(
        (a, b) => (b.installCount ?? 0) - (a.installCount ?? 0),
      );
    }

    return result;
  }, [plugins, search, selectedTag, sort, fuse]);

  const loadMore = useCallback(
    () =>
      setVisibleCount((prev) =>
        Math.min(prev + ITEMS_PER_PAGE, filtered.length),
      ),
    [filtered.length],
  );

  const hasMore = visibleCount < filtered.length;
  const sentinelRef = useInfiniteScroll(loadMore, hasMore);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          placeholder={`Search ${plugins.length} plugins by name, keyword...`}
          className="max-w-[520px]"
        />

        <Select
          value={sort ?? "popular"}
          onValueChange={(v) => setSort(v === "popular" ? null : v)}
        >
          <SelectTrigger className="h-11 w-[160px] flex-shrink-0 rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="popular">Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 flex items-center gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab.label}
            variant={
              tab.key === null
                ? !selectedTag
                  ? "secondary"
                  : "ghost"
                : selectedTag === tab.key
                  ? "secondary"
                  : "ghost"
            }
            className={cn(
              "h-8 rounded-full px-4",
              (tab.key === null ? !selectedTag : selectedTag === tab.key)
                ? "text-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => setSelectedTag(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {filtered.slice(0, visibleCount).map((plugin) => (
              <PluginCard key={plugin.slug} plugin={plugin} />
            ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-px" />}
        </>
      ) : (
        <div className="mt-24 flex flex-col items-center">
          <p className="text-center text-sm text-muted-foreground">
            No plugins found
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full border-border"
            onClick={() => setSelectedTag(null)}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
