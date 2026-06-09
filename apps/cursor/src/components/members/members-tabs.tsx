"use client";

import { useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { cn } from "@/lib/utils";
import { AddCompanyButton } from "../company/add-company-button";
import { type Company, CompanyCard } from "../company/company-card";
import { SearchInput } from "../search-input";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Skeleton } from "../ui/skeleton";
import { MembersCard } from "./members-card";

const PAGE_SIZE = 90;

const SKELETON_KEYS = Array.from({ length: 12 }, (_, i) => `skeleton-${i}`);

export type Member = {
  id: string;
  slug: string;
  image: string;
  name: string;
  follower_count: number;
  is_ambassador?: boolean;
};

const categoryTabs = [
  { key: null, label: "Developers" },
  { key: "ambassadors", label: "Ambassadors" },
  { key: "companies", label: "Companies" },
] as const;

async function fetchMembersPage(
  offset: number,
  sort: string | null,
  q: string | null,
  ambassadorsOnly: boolean,
) {
  const params = new URLSearchParams({ offset: String(offset) });
  if (sort) params.set("sort", sort);
  if (q) params.set("q", q);
  if (ambassadorsOnly) params.set("ambassadors", "1");
  const res = await fetch(`/api/members?${params}`);
  const json = await res.json();
  return json as { data: Member[]; hasMore: boolean };
}

export function MembersTabs({
  totalMembers,
  companies,
  initialMembers = [],
}: {
  totalMembers: number;
  companies: Company[];
  initialMembers?: Member[];
}) {
  const [selectedTab, setSelectedTab] = useQueryState("tab");
  const [sort, setSort] = useQueryState("sort");
  const [search] = useQueryState("q");
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [loading, setLoading] = useState(initialMembers.length === 0);
  const [hasMoreMembers, setHasMoreMembers] = useState(
    initialMembers.length === PAGE_SIZE,
  );
  const [companyVisible, setCompanyVisible] = useState(PAGE_SIZE);
  const offsetRef = useRef(initialMembers.length);
  const loadingRef = useRef(false);
  const sortRef = useRef(sort);
  const searchRef = useRef(search);
  const initialLoadRef = useRef(true);
  sortRef.current = sort;
  searchRef.current = search;

  const isAmbassadors = selectedTab === "ambassadors";
  const ambassadorsRef = useRef(isAmbassadors);
  ambassadorsRef.current = isAmbassadors;

  useEffect(() => {
    if (initialLoadRef.current && !sort && !search && !isAmbassadors) {
      initialLoadRef.current = false;
      return;
    }
    initialLoadRef.current = false;

    let cancelled = false;
    setMembers([]);
    setHasMoreMembers(true);
    setLoading(true);
    offsetRef.current = 0;
    loadingRef.current = true;

    const debounce = setTimeout(
      () => {
        fetchMembersPage(0, sort, search, isAmbassadors).then(
          ({ data, hasMore }) => {
            if (cancelled) return;
            setMembers(data);
            offsetRef.current = data.length;
            setHasMoreMembers(hasMore);
            loadingRef.current = false;
            setLoading(false);
          },
        );
      },
      search ? 300 : 0,
    );

    return () => {
      cancelled = true;
      clearTimeout(debounce);
    };
  }, [sort, search, isAmbassadors]);

  const loadMoreMembers = useCallback(() => {
    if (loadingRef.current || !hasMoreMembers) return;
    loadingRef.current = true;

    fetchMembersPage(
      offsetRef.current,
      sortRef.current,
      searchRef.current,
      ambassadorsRef.current,
    ).then(({ data, hasMore }) => {
      setMembers((prev) => [...prev, ...data]);
      offsetRef.current += data.length;
      setHasMoreMembers(hasMore);
      loadingRef.current = false;
    });
  }, [hasMoreMembers]);

  const filteredCompanies = useMemo(() => {
    const q = (search ?? "").toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => c.name.toLowerCase().includes(q));
  }, [search, companies]);

  useEffect(() => {
    setCompanyVisible(PAGE_SIZE);
  }, [search]);

  const loadMoreCompanies = useCallback(
    () =>
      setCompanyVisible((prev) =>
        Math.min(prev + PAGE_SIZE, filteredCompanies.length),
      ),
    [filteredCompanies.length],
  );

  const isCompanies = selectedTab === "companies";
  const hasMore = isCompanies
    ? companyVisible < filteredCompanies.length
    : hasMoreMembers;

  const searchPlaceholder = isCompanies
    ? "Search companies..."
    : isAmbassadors
      ? "Search ambassadors by name..."
      : `Search ${totalMembers.toLocaleString()} members by name...`;

  const emptyLabel = isCompanies
    ? "No companies found"
    : isAmbassadors
      ? "No ambassadors found"
      : "No members found";

  const loadCursor = isCompanies ? companyVisible : members.length;

  const sentinelRef = useInfiniteScroll(
    isCompanies ? loadMoreCompanies : loadMoreMembers,
    hasMore,
    loadCursor,
  );

  const handleTabChange = (key: string | null) => {
    setSelectedTab(key);
    setCompanyVisible(PAGE_SIZE);
  };

  const handleSortChange = (key: string | null) => {
    setSort(key);
  };

  const visibleItems = isCompanies
    ? filteredCompanies.slice(0, companyVisible)
    : members;

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          placeholder={searchPlaceholder}
          className="max-w-[520px]"
        />

        {isCompanies ? <AddCompanyButton redirect={true} /> : null}

        {!isCompanies && (
          <Select
            value={sort ?? "recent"}
            onValueChange={(v) => handleSortChange(v === "recent" ? null : v)}
          >
            <SelectTrigger className="h-11 w-[160px] flex-shrink-0 rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="recent">Recent</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-6 flex items-center gap-2">
        {categoryTabs.map((tab) => (
          <Button
            key={tab.label}
            variant={
              tab.key === null
                ? !selectedTab
                  ? "secondary"
                  : "ghost"
                : selectedTab === tab.key
                  ? "secondary"
                  : "ghost"
            }
            className={cn(
              "h-8 rounded-full px-4",
              (tab.key === null ? !selectedTab : selectedTab === tab.key)
                ? "text-foreground"
                : "text-muted-foreground",
            )}
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {loading && visibleItems.length === 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SKELETON_KEYS.map((key) => (
            <div
              key={key}
              className="flex items-center gap-3 rounded-md border border-border p-3"
            >
              <Skeleton className="size-10 rounded-[6px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : visibleItems.length > 0 ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isCompanies
              ? (visibleItems as Company[]).map((company) => (
                  <CompanyCard key={company.id} company={company} />
                ))
              : (visibleItems as Member[]).map((member) => (
                  <MembersCard key={member.id} member={member} />
                ))}
          </div>

          {hasMore && <div ref={sentinelRef} className="h-px" />}
        </>
      ) : (
        <div className="mt-24 flex flex-col items-center">
          <p className="text-center text-sm text-muted-foreground">
            {emptyLabel}
          </p>
          <Button
            variant="outline"
            className="mt-4 rounded-full border-border"
            onClick={() => handleTabChange(null)}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
