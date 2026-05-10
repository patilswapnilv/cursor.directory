import type { PluginCardData } from "@/components/plugins/plugin-card";
import { Startpage } from "@/components/startpage";
import {
  getMembers,
  getPlugins,
  getTotalUsers,
} from "@/data/queries";
import type { Metadata } from "next";
import { Suspense } from "react";

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

function getPluginType(components: { type: string }[]): "rules" | "mcp" | "both" {
  const hasRules = components.some((c) => c.type === "rule");
  const hasMcp = components.some((c) => c.type === "mcp_server");
  if (hasRules && hasMcp) return "both";
  if (hasMcp) return "mcp";
  return "rules";
}

function toPluginCard(p: NonNullable<Awaited<ReturnType<typeof getPlugins>>["data"]>[number]): PluginCardData {
  const components = p.plugin_components ?? [];
  return {
    name: p.name,
    slug: p.slug,
    description: p.description ?? "",
    logo: p.logo,
    type: getPluginType(components),
    rulesCount: components.filter((c) => c.type === "rule").length,
    mcpCount: components.filter((c) => c.type === "mcp_server").length,
    keywords: p.keywords,
    installCount: p.install_count,
    href: `/plugins/${p.slug}`,
  };
}

export default async function Page() {
  const [
    { data: totalUsers },
    { data: members },
    { data: allPluginsData },
  ] = await Promise.all([
    getTotalUsers(),
    getMembers({ page: 1, limit: 16 }),
    getPlugins({ fetchAll: true }),
  ]);

  const allPluginsRaw = allPluginsData ?? [];

  const allPlugins = allPluginsRaw
    .map(toPluginCard)
    .sort((a, b) => a.name.localeCompare(b.name));

  const popularPlugins = allPluginsRaw
    .filter((p) => p.install_count > 0)
    .sort((a, b) => b.install_count - a.install_count)
    .slice(0, 12)
    .map(toPluginCard);

  const recentPlugins = [...allPluginsRaw]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20)
    .map(toPluginCard);

  const starredPlugins = allPluginsRaw
    .filter((p) => p.star_count > 0)
    .sort((a, b) => b.star_count - a.star_count)
    .slice(0, 8)
    .map(toPluginCard);

  return (
    <div className="min-h-screen w-full">
      <div className="w-full">
        <Suspense>
          <Startpage
            popularPlugins={popularPlugins}
            allPlugins={allPlugins}
            recentPlugins={recentPlugins}
            starredPlugins={starredPlugins}
            totalUsers={totalUsers?.count ?? 0}
            members={members}
          />
        </Suspense>
      </div>
    </div>
  );
}
