import { createClient } from "@/utils/supabase/client";
import { fetchAllPages } from "@/utils/supabase/pagination";

export type CompanySearchResult = {
  id: string;
  name: string;
  slug: string;
  image: string;
  location: string;
};

type CompanyRow = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  location: string | null;
};

function toSearchResult(company: CompanyRow): CompanySearchResult {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    image: company.image ?? "",
    location: company.location ?? "",
  };
}

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
    return ((data ?? []) as CompanyRow[]).map(toSearchResult);
  }

  const { data } = await fetchAllPages<CompanyRow>((from, to) =>
    baseQuery().range(from, to),
  );

  return (data ?? []).map(toSearchResult);
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
