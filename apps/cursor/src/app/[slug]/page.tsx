import { notFound, redirect } from "next/navigation";
import { getRuleRedirectSlugs, getRuleRedirectTarget } from "@/data/queries";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const { data } = await getRuleRedirectSlugs();
  const unique = [...new Set((data ?? []).map((row) => row.slug))];
  return unique.map((slug) => ({ slug }));
}

/**
 * Legacy rule URLs (`/{rule-slug}`) redirect to the plugin that now contains
 * the rule component. Rules predate plugins and live on as `rule`-type
 * plugin components.
 *
 * Each page resolves its own slug with a small per-slug cached query.
 * Don't share a fetch-the-whole-plugins-table cache entry here: thousands
 * of these pages prerender concurrently, and waiting on that slow fill
 * times out the build (`USE_CACHE_TIMEOUT`).
 */
export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  const { data: pluginSlug } = await getRuleRedirectTarget(slug);

  if (pluginSlug) {
    redirect(`/plugins/${pluginSlug}`);
  }

  notFound();
}
