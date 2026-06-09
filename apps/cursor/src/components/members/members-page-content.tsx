import { cacheLife, cacheTag } from "next/cache";
import type { Company } from "@/components/company/company-card";
import { JoinCommunityLink } from "@/components/members/join-community-link";
import {
  type Member,
  type MembersTab,
  MembersTabs,
} from "@/components/members/members-tabs";
import { getCompanies, getMembers, getTotalUsers } from "@/data/queries";
import { formatCount } from "@/lib/utils";

/**
 * Shared content for the /members, /members/ambassadors and
 * /members/companies routes. Each tab has a dedicated, fully prerendered
 * URL so a hard reload serves the exact same HTML as a client-side tab
 * switch — no layout shift from hydrating a `?tab=` query param.
 *
 * The whole subtree is cached (stale-while-revalidate, 5-minute background
 * refresh): no per-request rendering, no streaming holes. The session-aware
 * "Join" CTA is a client component gated on an auth-cookie check, and the
 * search/sort filters are client-only state (see `nuqs-static-adapter`),
 * so nothing defers to request time.
 */
export async function MembersPageContent({ tab }: { tab: MembersTab }) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag("users", "companies");

  const [{ data: totalUsers }, { data: companies }, { data: initialMembers }] =
    await Promise.all([
      getTotalUsers(),
      tab === "companies"
        ? getCompanies()
        : Promise.resolve({ data: null, error: null }),
      tab === "companies"
        ? Promise.resolve({ data: null, error: null })
        : getMembers({
            page: 1,
            limit: 90,
            ambassadorsOnly: tab === "ambassadors",
          }),
    ]);

  return (
    <div className="page-shell pb-32 pt-24 md:pt-32">
      <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <h1 className="marketing-page-title">Members</h1>
          <p className="marketing-copy max-w-2xl">
            {formatCount(totalUsers?.count ?? 0)}+ developers and companies
            building with Cursor.
          </p>
        </div>

        <JoinCommunityLink />
      </div>

      <MembersTabs
        tab={tab}
        totalMembers={totalUsers?.count ?? 0}
        companies={(companies as Company[] | null) ?? []}
        initialMembers={(initialMembers as Member[] | null) ?? []}
      />
    </div>
  );
}
