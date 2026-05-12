"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PluginIconFallback } from "@/components/plugins/plugin-icon";
import { VerifiedBadge } from "@/components/plugins/verified-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatCount } from "@/lib/utils";

export type LeaderboardItem = {
  name: string;
  slug: string;
  description?: string;
  logo?: string | null;
  author?: string | null;
  authorUrl?: string | null;
  verified?: boolean;
  installCount: number;
  starCount: number;
  createdAt: string;
  href: string;
};

type LeaderboardSort = "installs" | "recent" | "stars";

const TABS: { id: LeaderboardSort; label: string }[] = [
  { id: "installs", label: "All Time" },
  { id: "recent", label: "Recent" },
  { id: "stars", label: "Most Starred" },
];

const isSvgLogo = (url: string) => url.endsWith(".svg");

function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function metricFor(item: LeaderboardItem, sort: LeaderboardSort): number {
  switch (sort) {
    case "installs":
      return item.installCount;
    case "stars":
      return item.starCount;
    case "recent":
      return new Date(item.createdAt).getTime();
  }
}

function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diff / day);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

type Row =
  | { kind: "item"; rank: number; item: LeaderboardItem }
  | {
      kind: "more";
      author: string;
      count: number;
      totalMetric: number;
      sort: LeaderboardSort;
    };

function buildRows(
  items: LeaderboardItem[],
  sort: LeaderboardSort,
  groupByAuthor: boolean,
): Row[] {
  const sorted = [...items].sort(
    (a, b) => metricFor(b, sort) - metricFor(a, sort),
  );

  if (!groupByAuthor) {
    return sorted.map((item, i) => ({ kind: "item", rank: i + 1, item }));
  }

  const totalsPerAuthor = new Map<string, number>();
  const countPerAuthor = new Map<string, number>();
  for (const it of sorted) {
    if (!it.author) continue;
    totalsPerAuthor.set(
      it.author,
      (totalsPerAuthor.get(it.author) ?? 0) + metricFor(it, sort),
    );
    countPerAuthor.set(it.author, (countPerAuthor.get(it.author) ?? 0) + 1);
  }

  const seen = new Set<string>();
  const rows: Row[] = [];
  let rank = 0;

  for (const item of sorted) {
    rank += 1;
    const author = item.author?.trim() || null;
    if (author && seen.has(author)) {
      // collapsed into the "+X more" entry shown earlier; rank still
      // advances so the next visible item reflects its true position
      continue;
    }
    rows.push({ kind: "item", rank, item });
    if (author) {
      seen.add(author);
      const total = countPerAuthor.get(author) ?? 1;
      if (total > 1) {
        rows.push({
          kind: "more",
          author,
          count: total - 1,
          totalMetric: totalsPerAuthor.get(author) ?? 0,
          sort,
        });
      }
    }
  }

  return rows;
}

function PluginLogo({ item }: { item: LeaderboardItem }) {
  if (isValidImageUrl(item.logo)) {
    return (
      <Avatar className="size-7 rounded-none shrink-0 border border-border bg-transparent">
        <AvatarImage
          src={item.logo}
          alt={item.name}
          className={cn("object-cover", isSvgLogo(item.logo) && "invert")}
        />
        <AvatarFallback className="rounded-none bg-transparent text-xs text-foreground">
          {item.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
    );
  }
  return <PluginIconFallback size={28} />;
}

function ItemRow({
  rank,
  item,
  display,
}: {
  rank: number;
  item: LeaderboardItem;
  display: string;
}) {
  return (
    <Link
      href={item.href}
      className="group grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-border py-3 transition-colors hover:text-foreground"
    >
      <span className="text-sm font-mono tabular-nums text-muted-foreground">
        {rank}
      </span>

      <div className="flex min-w-0 items-center gap-3">
        <PluginLogo item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-medium text-foreground">
              {item.name}
            </span>
            {item.verified ? <VerifiedBadge size="sm" /> : null}
            {item.author ? (
              <span className="hidden truncate text-xs text-muted-foreground md:inline">
                · {item.author}
              </span>
            ) : null}
          </div>
          {item.description ? (
            <p className="max-w-[60ch] truncate text-xs text-muted-foreground">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>

      <span className="text-right text-sm font-mono tabular-nums text-muted-foreground">
        {display}
      </span>
    </Link>
  );
}

function MoreRow({
  author,
  count,
  totalMetric,
  sort,
}: {
  author: string;
  count: number;
  totalMetric: number;
  sort: LeaderboardSort;
}) {
  const href = `/plugins?q=${encodeURIComponent(author)}`;
  return (
    <Link
      href={href}
      className="grid grid-cols-[44px_1fr_auto] items-center gap-4 border-b border-border py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      <span aria-hidden />
      <span className="truncate">
        +{count} more from{" "}
        <span className="text-foreground">{author}</span>
      </span>
      {sort === "recent" ? (
        <span aria-hidden />
      ) : (
        <span className="text-right font-mono tabular-nums">
          {formatCount(totalMetric)} total
        </span>
      )}
    </Link>
  );
}

export function PluginLeaderboard({
  items,
  initialSort = "installs",
  groupByAuthor = false,
  maxItems = 500,
  chunkSize = 50,
}: {
  items: LeaderboardItem[];
  initialSort?: LeaderboardSort;
  groupByAuthor?: boolean;
  maxItems?: number;
  chunkSize?: number;
}) {
  const [sort, setSort] = useState<LeaderboardSort>(initialSort);
  const [visible, setVisible] = useState(chunkSize);

  const rows = useMemo(() => {
    const built = buildRows(items, sort, groupByAuthor);
    return built.slice(0, maxItems);
  }, [items, sort, groupByAuthor, maxItems]);

  const visibleRows = rows.slice(0, visible);
  const hasMore = visible < rows.length;

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible((v) => Math.min(v + chunkSize, rows.length));
        }
      },
      { rootMargin: "600px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, rows.length, chunkSize]);

  const onTabChange = (next: LeaderboardSort) => {
    setSort(next);
    setVisible(chunkSize);
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-5 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "-mb-px border-b py-2 text-sm transition-colors",
              sort === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {visibleRows.map((row) => {
          if (row.kind === "more") {
            return (
              <MoreRow
                key={`more-${sort}-${row.author}`}
                author={row.author}
                count={row.count}
                totalMetric={row.totalMetric}
                sort={row.sort}
              />
            );
          }
          const display =
            sort === "recent"
              ? formatRelativeDate(row.item.createdAt)
              : formatCount(metricFor(row.item, sort));
          return (
            <ItemRow
              key={row.item.slug}
              rank={row.rank}
              item={row.item}
              display={display}
            />
          );
        })}

        {visibleRows.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No plugins to show yet.
          </div>
        ) : null}
      </div>

      {hasMore ? (
        <div
          ref={sentinelRef}
          className="h-10"
          aria-hidden
        />
      ) : (
        <div className="mt-6 flex justify-start">
          <Link
            href="/plugins"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Browse all plugins
          </Link>
        </div>
      )}
    </div>
  );
}
