import { createClient } from "@/utils/supabase/client";

export type CompanySearchResult = {
  id: string;
  name: string;
  slug: string;
  image: string;
  location: string;
};

// Searches the entire companies table by name (case-insensitive), rather than
// filtering an already-loaded page of results.
export async function searchCompanies(
  term: string,
  limit?: number,
): Promise<CompanySearchResult[]> {
  const trimmed = term.trim();

  if (!trimmed) {
    return [];
  }

  const supabase = createClient();
  const baseQuery = () =>
    supabase
      .from("companies")
      .select("id, name, slug, image, location")
      .ilike("name", `%${trimmed}%`)
      .order("name", { ascending: true });

  if (limit !== undefined) {
    const { data } = await baseQuery().limit(limit);
    return (data ?? []).map((company) => ({
      id: company.id,
      name: company.name,
      slug: company.slug,
      image: company.image ?? "",
      location: company.location ?? "",
    }));
  }

  const PAGE_SIZE = 1000;
  const all: CompanySearchResult[] = [];
  let from = 0;

  while (true) {
    const { data } = await baseQuery().range(from, from + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    all.push(
      ...data.map((company) => ({
        id: company.id,
        name: company.name,
        slug: company.slug,
        image: company.image ?? "",
        location: company.location ?? "",
      })),
    );
    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return all;
}

export async function getMCPsClient({
  page = 1,
  limit = 36,
  search,
}: {
  page?: number;
  limit?: number;
  search?: string | null;
} = {}) {
  const supabase = createClient();
  const query = supabase
    .from("mcps")
    .select("*")
    .eq("active", true)
    .order("company_id", { ascending: true, nullsFirst: false })
    .limit(limit)
    .range((page - 1) * limit, page * limit - 1);

  if (search) {
    query.textSearch("fts", `%${search}%:*`);
  }

  const { data, error } = await query;

  return { data, error };
}
