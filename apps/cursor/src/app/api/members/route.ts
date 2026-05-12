import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/admin-client";

const PAGE_SIZE = 90;
const MAX_OFFSET = 10000;
const ALLOWED_SORT = new Set(["popular"]);
const PUBLIC_FIELDS =
  "id, name, image, slug, follower_count, is_ambassador" as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset)
    ? Math.max(0, Math.min(Math.floor(rawOffset), MAX_OFFSET))
    : 0;

  const sortParam = searchParams.get("sort");
  const col = ALLOWED_SORT.has(sortParam ?? "")
    ? "follower_count"
    : "created_at";

  const q = (searchParams.get("q") ?? "").trim().slice(0, 100);
  const ambassadorsOnly = searchParams.get("ambassadors") === "1";

  const supabase = await createClient();

  let query = supabase
    .from("users")
    .select(PUBLIC_FIELDS)
    .eq("public", true)
    .neq("name", "unknown user")
    .order(col, { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (ambassadorsOnly) {
    query = query.eq("is_ambassador", true);
  }

  if (q.length > 0) {
    query = query.ilike("name", `%${q}%`);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ data: [], hasMore: false }, { status: 500 });
  }

  const safeData = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    image: row.image,
    slug: row.slug,
    follower_count: row.follower_count,
    is_ambassador: row.is_ambassador ?? false,
  }));

  return new NextResponse(
    JSON.stringify({ data: safeData, hasMore: safeData.length === PAGE_SIZE }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "CDN-Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "Vercel-CDN-Cache-Control":
          "public, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
