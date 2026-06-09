import { notFound, redirect } from "next/navigation";
import { getPlugins } from "@/data/queries";

type Params = Promise<{ slug: string }>;

/**
 * Rules predate plugins and now live as `rule`-type plugin components.
 * Maps every rule component slug to its parent plugin's slug (first plugin
 * wins, matching the newest-first order plugins are fetched in).
 */
async function getRuleRedirects(): Promise<Map<string, string>> {
  const { data: plugins } = await getPlugins({ fetchAll: true });

  const redirects = new Map<string, string>();
  for (const plugin of plugins ?? []) {
    for (const component of plugin.plugin_components ?? []) {
      if (component.type === "rule" && !redirects.has(component.slug)) {
        redirects.set(component.slug, plugin.slug);
      }
    }
  }
  return redirects;
}

export async function generateStaticParams() {
  const redirects = await getRuleRedirects();
  return [...redirects.keys()].map((slug) => ({ slug }));
}

/**
 * Legacy rule URLs (`/{rule-slug}`) redirect to the plugin that now contains
 * the rule component.
 */
export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  const redirects = await getRuleRedirects();
  const pluginSlug = redirects.get(slug);

  if (pluginSlug) {
    redirect(`/plugins/${pluginSlug}`);
  }

  notFound();
}
