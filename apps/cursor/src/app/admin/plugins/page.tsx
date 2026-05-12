import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getFlaggedPlugins,
  getPendingPlugins,
  getPendingVerificationRequests,
  getStuckScans,
} from "@/data/queries";
import { isAdmin } from "@/utils/admin";
import { getSession } from "@/utils/supabase/auth";
import { AdminPluginsTabs } from "./admin-plugins-tabs";

export const metadata: Metadata = {
  title: "Review Plugins | Admin",
};

export default async function AdminPluginsPage() {
  const session = await getSession();

  if (!session || !isAdmin(session.user.id)) {
    redirect("/");
  }

  const [
    { data: flagged },
    { data: stuck },
    { data: pending },
    { data: verification },
  ] = await Promise.all([
    getFlaggedPlugins(),
    getStuckScans(),
    getPendingPlugins(),
    getPendingVerificationRequests(),
  ]);

  return (
    <div className="min-h-screen px-6 pt-24 md:pt-32 pb-32">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-10">
          <h1 className="marketing-page-title mb-3">Review Plugins</h1>
          <p className="marketing-copy text-muted-foreground">
            Plugin moderation queue. Review submissions the security scanner
            flagged, fix scans that didn&apos;t complete, approve verification
            requests, and browse hidden plugins.
          </p>
        </div>

        <Suspense>
          <AdminPluginsTabs
            flagged={flagged ?? []}
            stuck={stuck ?? []}
            pending={pending ?? []}
            verification={verification ?? []}
          />
        </Suspense>
      </div>
    </div>
  );
}
