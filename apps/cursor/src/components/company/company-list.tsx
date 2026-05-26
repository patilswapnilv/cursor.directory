"use client";

import { useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { searchCompanies } from "@/data/client-queries";
import { SearchInput } from "../search-input";
import { Button } from "../ui/button";
import type { Company } from "./company-card";
import { CompanyCard } from "./company-card";

export function CompanyList({ data }: { data?: Company[] | null }) {
  const [companies, setCompanies] = useState<Company[]>(data ?? []);
  const [search, setSearch] = useQueryState("q");

  useEffect(() => {
    const term = search?.trim() ?? "";

    // No search: show the full server-rendered list.
    if (!term) {
      setCompanies(data ?? []);
      return;
    }

    // With a search term, query the entire companies table rather than
    // filtering only the rows that happen to be loaded on the page.
    setCompanies([]);
    let active = true;
    const handle = setTimeout(async () => {
      const results = await searchCompanies(term);
      if (active) {
        setCompanies(results);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [search, data]);

  return (
    <div className="mt-8">
      <SearchInput placeholder="Search companies" />

      {companies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 mt-8">
          {companies?.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      ) : (
        <div className="mt-24 flex flex-col items-center">
          <div className="text-center text-sm text-muted-foreground">
            No companies found
          </div>

          <Button
            variant="outline"
            className="mt-4 rounded-full border-border"
            onClick={() => setSearch(null)}
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
}
