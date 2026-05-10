import { notFound, redirect } from "next/navigation";
import { getPlugins } from "@/data/queries";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const { data: plugins } = await getPlugins({ fetchAll: true });
  if (!plugins) return [];

  return plugins.flatMap((plugin) =>
    (plugin.plugin_components ?? [])
      .filter((c) => c.type === "rule")
      .map((rule) => ({ slug: rule.slug })),
  );
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;

  const { data: plugins } = await getPlugins({ fetchAll: true });
  const parentPlugin = (plugins ?? []).find((p) =>
    (p.plugin_components ?? []).some(
      (c) => c.type === "rule" && c.slug === slug,
    ),
  );

  if (parentPlugin) {
    redirect(`/plugins/${parentPlugin.slug}`);
  }

  notFound();
}

export const revalidate = 3600;
