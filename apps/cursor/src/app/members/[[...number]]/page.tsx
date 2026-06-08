import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import type { Company } from "@/components/company/company-card";
import { type Member, MembersTabs } from "@/components/members/members-tabs";
import { getCompanies, getMembers, getTotalUsers } from "@/data/queries";
import { formatCount } from "@/lib/utils";
import { getSession } from "@/utils/supabase/auth";

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
 * Reading the session opts a component out of the static shell, so the
 * "Join" CTA streams in for signed-out visitors while the rest of the page
 * (cached member/company data) is prerendered.
 */
async function JoinCommunityLink() {
  const session = await getSession();
  if (session) return null;

  return (
    <Link
      href="/login"
      className="flex h-10 flex-shrink-0 items-center rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-cursor transition-colors hover:bg-accent"
    >
      Join the community
    </Link>
  );
}

export default async function Page() {
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

        <Suspense fallback={null}>
          <JoinCommunityLink />
        </Suspense>
      </div>

      <Suspense>
        <MembersTabs
          totalMembers={totalUsers?.count ?? 0}
          companies={(companies as Company[] | null) ?? []}
          initialMembers={(initialMembers as Member[] | null) ?? []}
        />
      </Suspense>
    </div>
  );
}
