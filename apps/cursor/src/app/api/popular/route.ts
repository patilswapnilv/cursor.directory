import { NextResponse } from "next/server";
import { getPlugins } from "@/data/queries";

export const revalidate = 86400;
export const dynamic = "force-static";

export async function GET() {
  const { data: plugins } = await getPlugins({ fetchAll: true });

  const allRules = (plugins ?? [])
    .flatMap((p) =>
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
            count: p.install_count,
            author: meta?.author_name
              ? {
                  name: meta.author_name as string,
                  url: (meta.author_url as string) ?? null,
                  avatar: (meta.author_avatar as string) ?? null,
                }
              : undefined,
          };
        }),
    )
    .sort((a, b) => b.count - a.count);

  const uniqueSlugs = new Set<string>();
  const uniqueRules = allRules.filter((r) => {
    if (uniqueSlugs.has(r.slug)) return false;
    uniqueSlugs.add(r.slug);
    return true;
  });

  return new NextResponse(JSON.stringify({ data: uniqueRules }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, s-maxage=86400",
      "CDN-Cache-Control": "public, s-maxage=86400",
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400",
    },
  });
}
