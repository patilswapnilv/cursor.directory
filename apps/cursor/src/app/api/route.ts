import { NextResponse } from "next/server";
import { getPlugins } from "@/data/queries";

export const dynamic = "force-static";
export const revalidate = 86400;

export async function GET() {
  const { data: plugins } = await getPlugins({ fetchAll: true });
  const rules = (plugins ?? []).flatMap((p) =>
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

  return NextResponse.json({ data: rules });
}
