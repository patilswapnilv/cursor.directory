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

export default function Page() {
  return <MembersPageContent tab="developers" />;
}
