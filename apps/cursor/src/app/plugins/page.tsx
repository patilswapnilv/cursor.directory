import type { PluginCardData } from "@/components/plugins/plugin-card";
import { PluginList } from "@/components/plugins/plugin-list";
import { getMCPs } from "@/data/queries";
import { getPlugins } from "@directories/data/plugins";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Plugins for Cursor - Rules & MCP Servers",
  description:
    "Browse community plugins for Cursor, including reusable rules and MCP server integrations.",
};

export const revalidate = 3600;

export default async function Page() {
  const filePlugins = getPlugins();
  const { data: mcps } = await getMCPs({ fetchAll: true });

  const rulePlugins: PluginCardData[] = filePlugins
    .filter((p) => p.rules.length > 0)
    .map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      logo: p.logo,
      type: "rules" as const,
      rulesCount: p.rules.length,
      keywords: p.keywords,
      href: `/plugins/${p.slug}`,
    }));

  const mcpPlugins: PluginCardData[] = (mcps ?? []).map((mcp) => ({
    name: mcp.name,
    slug: `mcp-${mcp.slug}`,
    description: mcp.description,
    logo: mcp.logo,
    type: "mcp" as const,
    href: `/plugins/mcp-${mcp.slug}`,
  }));

  const seen = new Set<string>();
  const allPlugins = [...rulePlugins, ...mcpPlugins]
    .filter((p) => {
      if (seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const tags = [
    ...new Set(filePlugins.flatMap((p) => p.keywords)),
  ].sort();

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-12 md:mt-24 pb-32">
      <div className="mb-8 space-y-2">
        <h1 className="text-xl">Plugins</h1>
        <p className="text-sm text-[#878787]">
          Community plugins for Cursor, including reusable rules and MCP server
          integrations.{" "}
          <Link
            href="/mcp/new"
            className="border-b border-border border-dashed"
          >
            Submit a plugin
          </Link>
          .
        </p>
      </div>

      <Suspense>
        <PluginList plugins={allPlugins} tags={tags} />
      </Suspense>
    </div>
  );
}
