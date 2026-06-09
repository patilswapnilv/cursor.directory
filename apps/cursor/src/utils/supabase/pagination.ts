type PageResult<T> = { data: T[] | null; error: unknown };

/**
 * Fetches every row of a query by walking it in `pageSize` chunks.
 *
 * PostgREST caps a single response at `max_rows`, so "fetch all" reads must
 * paginate with `.range()`. Centralizing the loop keeps the off-by-one and
 * has-more logic in one place.
 *
 * `fetchPage` receives an inclusive `[from, to]` row range and must apply it
 * with `.range(from, to)` on a freshly built query.
 *
 * Returns `{ data: null, error }` as soon as any page fails; otherwise all
 * rows with `error: null`.
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<PageResult<T>>,
  pageSize = 1000,
): Promise<{ data: T[]; error: null } | { data: null; error: unknown }> {
  const all: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);

    if (error) return { data: null, error };
    if (!data || data.length === 0) break;

    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return { data: all, error: null };
}
