import type { Metadata } from "next";
import { MembersPageContent } from "@/components/members/members-page-content";

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
 * Legacy catch-all for old paginated URLs (`/members/2`, ...). The segment
 * is intentionally ignored — every legacy path serves the same cached
 * developers page. The named tabs (`/members/ambassadors`,
 * `/members/companies`) are static sibling routes and take precedence over
 * this dynamic segment.
 */
export default function Page() {
  return <MembersPageContent tab="developers" />;
}
