import type { Metadata } from "next";
import { MembersPageContent } from "@/components/members/members-page-content";

export const metadata: Metadata = {
  title: "Ambassadors | Cursor Directory",
  description: "Cursor Ambassadors helping the community build with Cursor.",
  openGraph: {
    title: "Ambassadors | Cursor Directory",
    description: "Cursor Ambassadors helping the community build with Cursor.",
  },
  twitter: {
    title: "Ambassadors | Cursor Directory",
    description: "Cursor Ambassadors helping the community build with Cursor.",
  },
};

export default function Page() {
  return <MembersPageContent tab="ambassadors" />;
}
