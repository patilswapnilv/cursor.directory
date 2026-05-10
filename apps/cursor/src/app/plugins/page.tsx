import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { PluginCardData } from "@/components/plugins/plugin-card";
import { PluginList } from "@/components/plugins/plugin-list";
import { getPlugins } from "@/data/queries";

export const metadata: Metadata = {
  title: "Plugins | Cursor Directory",
  description: "Rules, MCP servers, and integrations built by the community.",
  openGraph: {
    title: "Plugins | Cursor Directory",
    description: "Rules, MCP servers, and integrations built by the community.",
  },
  twitter: {
    title: "Plugins | Cursor Directory",
    description: "Rules, MCP servers, and integrations built by the community.",
  },
};

export const revalidate = 3600;

function getPluginType(
  components: { type: string }[],
): "rules" | "mcp" | "both" {
  const hasRules = components.some((c) => c.type === "rule");
  const hasMcp = components.some((c) => c.type === "mcp_server");
  if (hasRules && hasMcp) return "both";
  if (hasMcp) return "mcp";
  return "rules";
}

export default async function Page() {
  const { data: dbPlugins } = await getPlugins({ fetchAll: true });

  const dbPluginCards: PluginCardData[] = (dbPlugins ?? []).map((p) => {
    const components = p.plugin_components ?? [];
    const rulesCount = components.filter((c) => c.type === "rule").length;
    const mcpCount = components.filter((c) => c.type === "mcp_server").length;

    return {
      name: p.name,
      slug: p.slug,
      description: p.description ?? "",
      logo: p.logo,
      type: getPluginType(components),
      rulesCount,
      mcpCount,
      keywords: p.keywords,
      installCount: p.install_count,
      verified: p.verified,
      href: `/plugins/${p.slug}`,
    };
  });

  const allPlugins = dbPluginCards;

  const tags = [...new Set(allPlugins.flatMap((p) => p.keywords ?? []))].sort();

  return (
    <div className="page-shell pb-32 pt-24 md:pt-32">
      <div className="mb-10 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="marketing-page-title">Plugins</h1>
          <p className="marketing-copy max-w-2xl">
            Rules, MCP servers, and integrations built by the community.
          </p>
        </div>

        <Link
          href="/plugins/new"
          className="flex h-10 flex-shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-cursor transition-colors hover:bg-accent"
        >
          Submit a plugin
        </Link>
      </div>

      <Suspense>
        <PluginList plugins={allPlugins} tags={tags} />
      </Suspense>
    </div>
  );
}
