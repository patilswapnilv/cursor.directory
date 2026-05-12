import { NextResponse } from "next/server";
import { getPlugins } from "@/data/queries";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function generateStaticParams() {
  const { data: plugins } = await getPlugins({ fetchAll: true });
  return (plugins ?? []).flatMap((p) =>
    (p.plugin_components ?? [])
      .filter((c) => c.type === "rule")
      .map((c) => ({ slug: c.slug })),
  );
}

type Params = Promise<{ slug: string }>;

export async function GET(_: Request, segmentData: { params: Params }) {
  const { slug } = await segmentData.params;

  if (!slug) {
    return NextResponse.json({ error: "No slug provided" }, { status: 400 });
  }

  const { data: plugins } = await getPlugins({ fetchAll: true });
  const allRules = (plugins ?? []).flatMap((p) =>
    (p.plugin_components ?? [])
      .filter((c) => c.type === "rule")
      .map((c) => {
        const meta = c.metadata as Record<string, unknown>;
        return {
          title: c.name,
          slug: c.slug,
          tags: (meta?.tags as string[]) ?? [],
          libs: (meta?.libs as string[]) ?? [],
          content: c.content ?? "",
          author: meta?.author_name
            ? {
                name: meta.author_name as string,
                url: (meta.author_url as string) ?? null,
                avatar: (meta.author_avatar as string) ?? null,
              }
            : undefined,
        };
      }),
  );

  const rule = allRules.find((r) => r.slug === slug);

  if (!rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  return new Response(JSON.stringify({ data: rule }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400",
      "CDN-Cache-Control": "public, s-maxage=86400",
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
    },
  });
}
