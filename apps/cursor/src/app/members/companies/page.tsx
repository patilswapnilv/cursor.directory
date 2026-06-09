import type { Metadata } from "next";
import { MembersPageContent } from "@/components/members/members-page-content";

export const metadata: Metadata = {
  title: "Companies | Cursor Directory",
  description: "Companies building with Cursor.",
  openGraph: {
    title: "Companies | Cursor Directory",
    description: "Companies building with Cursor.",
  },
  twitter: {
    title: "Companies | Cursor Directory",
    description: "Companies building with Cursor.",
  },
};

export default function Page() {
  return <MembersPageContent tab="companies" />;
}
