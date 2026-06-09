import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import type { Company } from "@/components/company/company-card";
import { JoinCommunityLink } from "@/components/members/join-community-link";
import { type Member, MembersTabs } from "@/components/members/members-tabs";
import { getCompanies, getMembers, getTotalUsers } from "@/data/queries";
import { formatCount } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Members | Cursor Directory",
  description: "Thousands of developers and companies building with Cursor.",
  openGraph: {
    title: "Members | Cursor Directory",
    description: "Thousands of developers and companies building with Cursor.",
  },
  twitter: {
    title: "Members | Cursor Directory",
    description: "Thousands of developers and companies building with Cursor.",
  },
};

/**
 * The entire page is cached (stale-while-revalidate, 5-minute background
 * refresh): no per-request rendering, no streaming holes. The session-aware
 * "Join" CTA is a client component gated on an auth-cookie check, and the
 * tab/search filters are client-only state (see `nuqs-static-adapter`), so
 * nothing defers to request time. The `[[...number]]` segment is ignored —
 * legacy paginated URLs all serve this same cached page.
 */
export default async function Page() {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 86400 });
  cacheTag("users", "companies");

  const [{ data: totalUsers }, { data: companies }, { data: initialMembers }] =
    await Promise.all([
      getTotalUsers(),
      getCompanies(),
      getMembers({ page: 1, limit: 90 }),
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
        totalMembers={totalUsers?.count ?? 0}
        companies={(companies as Company[] | null) ?? []}
        initialMembers={(initialMembers as Member[] | null) ?? []}
      />
    </div>
  );
}
