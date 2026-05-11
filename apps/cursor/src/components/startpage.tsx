"use client";

import Fuse from "fuse.js";
import Link from "next/link";
import { useQueryState } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import type { PluginCardData } from "@/components/plugins/plugin-card";
import { PluginCard } from "@/components/plugins/plugin-card";
import { GlobalSearchInput } from "./global-search-input";
import { HeroTitle } from "./hero-title";
import { MembersCard } from "./members/members-card";

function ArrowIcon() {
  return (
    <svg
      width="12"
      height="13"
      viewBox="0 0 12 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <mask
        id="mask0_106_981"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="12"
        height="13"
      >
        <rect y="0.5" width="12" height="12" fill="#D9D9D9" />
      </mask>
      <g mask="url(#mask0_106_981)">
        <path
          d="M3.2 9.5L2.5 8.8L7.3 4H3V3H9V9H8V4.7L3.2 9.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

function SectionHeader({
  title,
  href,
  ctaLabel = "View all",
}: {
  title: string;
  href: string;
  ctaLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h3 className="section-eyebrow">{title}</h3>
      <Link
        href={href}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <span>{ctaLabel}</span>
        <ArrowIcon />
      </Link>
    </div>
  );
}

function PluginGrid({ plugins }: { plugins: PluginCardData[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {plugins.map((plugin) => (
        <PluginCard key={plugin.slug} plugin={plugin} />
      ))}
    </div>
  );
}

export function Startpage({
  popularPlugins,
  allPlugins,
  recentPlugins,
  starredPlugins,
  totalUsers,
  members,
}: {
  popularPlugins: PluginCardData[];
  allPlugins: PluginCardData[];
  recentPlugins: PluginCardData[];
  starredPlugins: PluginCardData[];
  totalUsers: number;
  members: unknown[] | null;
}) {
  const [search] = useQueryState("q", { defaultValue: "" });

  const isSearching = search.length > 0;

  const pluginFuse = useMemo(
    () =>
      new Fuse(allPlugins, {
        keys: [
          { name: "name", weight: 3 },
          { name: "slug", weight: 1.5 },
          { name: "keywords", weight: 1.5 },
          { name: "description", weight: 0.5 },
        ],
        threshold: 0.35,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [allPlugins],
  );

  const filteredPlugins = useMemo(() => {
    if (!isSearching) return [] as PluginCardData[];
    return pluginFuse.search(search).map((r) => r.item);
  }, [search, isSearching, pluginFuse]);

  const [searchedMembers, setSearchedMembers] = useState<any[] | null>(null);

  useEffect(() => {
    if (!isSearching) {
      setSearchedMembers(null);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`/api/members?q=${encodeURIComponent(search)}`, {
        signal: controller.signal,
      })
        .then((r) => r.json())
        .then(({ data }) => setSearchedMembers(data ?? []))
        .catch(() => {});
    }, 300);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, isSearching]);

  const filteredMembers = isSearching ? searchedMembers : members;

  const alphabeticalPlugins = useMemo(
    () => allPlugins.slice(0, 24),
    [allPlugins],
  );

  return (
    <div className="page-shell pb-24 pt-28 md:pt-36">
      <div className="relative mx-auto flex w-full flex-col gap-6">
        <div>
          <HeroTitle totalUsers={totalUsers} />

          <div className="mx-auto mb-20 w-full max-w-[720px]">
            <GlobalSearchInput />
          </div>

          {isSearching && filteredPlugins.length > 0 && (
            <div className="mb-14">
              <SectionHeader
                title="Plugins"
                href={`/plugins?q=${encodeURIComponent(search)}`}
                ctaLabel="See all results"
              />
              <PluginGrid plugins={filteredPlugins.slice(0, 12)} />
            </div>
          )}

          {popularPlugins.length > 0 && !isSearching && (
            <div className="mb-14">
              <SectionHeader
                title="Popular Plugins"
                href="/plugins"
              />
              <PluginGrid plugins={popularPlugins} />
            </div>
          )}

          {recentPlugins.length > 0 && !isSearching && (
            <div className="mb-14">
              <SectionHeader title="Recently Added" href="/plugins" />
              <PluginGrid plugins={recentPlugins} />
            </div>
          )}

          {starredPlugins.length > 0 && !isSearching && (
            <div className="mb-14">
              <SectionHeader title="Most Starred" href="/plugins" />
              <PluginGrid plugins={starredPlugins} />
            </div>
          )}

          {filteredMembers && filteredMembers.length > 0 && (
            <div className="mb-14">
              <div className="mb-5 flex items-center justify-between">
                <Link href="/members">
                  <h3 className="section-eyebrow">Members</h3>
                </Link>
                <Link
                  href={
                    isSearching
                      ? `/members?q=${encodeURIComponent(search)}`
                      : "/members"
                  }
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <span>{isSearching ? "See all results" : "View all"}</span>
                  <ArrowIcon />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredMembers
                  .slice(0, 8)
                  .map((member: any) => (
                    <MembersCard key={member.id} member={member} gray />
                  ))}
              </div>
            </div>
          )}

          {alphabeticalPlugins.length > 0 && !isSearching && (
            <div className="mb-14">
              <SectionHeader title="Browse All Plugins" href="/plugins" />
              <PluginGrid plugins={alphabeticalPlugins} />
            </div>
          )}

          {isSearching &&
            filteredPlugins.length === 0 &&
            (!filteredMembers || filteredMembers.length === 0) && (
              <div className="flex flex-col items-center mt-16">
                <p className="text-sm text-muted-foreground">
                  No results found for &quot;{search}&quot;
                </p>
                <Link
                  href={`/plugins?q=${encodeURIComponent(search)}`}
                  className="mt-2 border-b border-dashed border-input text-sm text-muted-foreground hover:text-foreground"
                >
                  Search all plugins
                </Link>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
