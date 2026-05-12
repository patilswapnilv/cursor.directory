import type { Metadata } from "next";
import { Suspense } from "react";
import type { LeaderboardItem } from "@/components/plugins/plugin-leaderboard";
import { Startpage } from "@/components/startpage";
import { getPlugins, getTotalUsers } from "@/data/queries";

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

export const dynamic = "force-static";
export const revalidate = 86400;

function toLeaderboardItem(
  p: NonNullable<Awaited<ReturnType<typeof getPlugins>>["data"]>[number],
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
    starCount: p.star_count,
    createdAt: p.created_at,
    href: `/plugins/${p.slug}`,
  };
}

export default async function Page() {
  const [{ data: totalUsers }, { data: allPluginsData }] = await Promise.all([
    getTotalUsers(),
    getPlugins({ fetchAll: true }),
  ]);

  const leaderboardItems = (allPluginsData ?? []).map(toLeaderboardItem);

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
