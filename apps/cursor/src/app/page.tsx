import type { Metadata } from "next";
import { Suspense } from "react";
import type { LeaderboardItem } from "@/components/plugins/plugin-leaderboard";
import { Startpage } from "@/components/startpage";
import {
  getPluginInstallVelocity,
  getPlugins,
  getTotalUsers,
} from "@/data/queries";

export const metadata: Metadata = {
  title: "Cursor Directory - Plugins for Cursor",
  description: "Discover plugins built by the Cursor community.",
  openGraph: {
    title: "Cursor Directory - Plugins for Cursor",
    description: "Discover plugins built by the Cursor community.",
  },
  twitter: {
    title: "Cursor Directory - Plugins for Cursor",
    description: "Discover plugins built by the Cursor community.",
  },
};

// All data here comes from `"use cache"` queries tagged `plugins`/`users`,
// so the page prerenders into the static shell and refreshes when actions
// invalidate those tags (installs, stars, plugin mutations). The pg_cron
// snapshot drift (20260514_plugin_install_snapshots) is covered by the
// time-based `cacheLife("hours")` on `getPluginInstallVelocity`, which
// revalidates in the background even during quiet periods.

function toLeaderboardItem(
  p: NonNullable<Awaited<ReturnType<typeof getPlugins>>["data"]>[number],
  installs30d: number,
): LeaderboardItem {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    logo: p.logo,
    author: p.author_name,
    authorUrl: p.author_url,
    verified: p.verified,
    installCount: p.install_count,
    installs30d,
    starCount: p.star_count,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
    permanentlyBlocked: p.permanently_blocked,
    flagSeverity: p.flag_severity,
    scanStatus: p.scan_status,
    href: `/plugins/${p.slug}`,
  };
}

export default async function Page() {
  const [
    { data: totalUsers },
    { data: allPluginsData },
    { data: velocityMap },
  ] = await Promise.all([
    getTotalUsers(),
    getPlugins({ fetchAll: true }),
    getPluginInstallVelocity(30),
  ]);

  const velocity = velocityMap ?? new Map<string, number>();
  const leaderboardItems = (allPluginsData ?? []).map((p) =>
    toLeaderboardItem(p, velocity.get(p.id) ?? 0),
  );

  return (
    <div className="min-h-screen w-full">
      <div className="w-full">
        <Suspense>
          <Startpage
            leaderboardItems={leaderboardItems}
            totalUsers={totalUsers?.count ?? 0}
          />
        </Suspense>
      </div>
    </div>
  );
}
