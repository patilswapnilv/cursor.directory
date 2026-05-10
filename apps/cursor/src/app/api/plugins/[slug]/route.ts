import { NextResponse } from "next/server";
import { getPluginBySlug } from "@/data/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, segmentData: { params: Params }) {
  const { slug } = await segmentData.params;

  if (!slug) {
    return NextResponse.json({ error: "No slug provided" }, { status: 400 });
  }

  const { data: plugin, error } = await getPluginBySlug(slug);

  if (error || !plugin) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  if (!plugin.active) {
    return NextResponse.json({ error: "Plugin not found" }, { status: 404 });
  }

  const components = (plugin.plugin_components ?? []).map((c) => ({
    type: c.type,
    name: c.name,
    slug: c.slug,
    description: c.description,
    content: c.content,
    metadata: c.metadata,
  }));

  return NextResponse.json({
    data: {
      name: plugin.name,
      slug: plugin.slug,
      description: plugin.description,
      version: plugin.version,
      repository: plugin.repository,
      components,
    },
  });
}
