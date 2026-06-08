import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { EditMCPForm } from "@/components/forms/edit-mcp";
import { Login } from "@/components/login";
import { MCPListingSwitch } from "@/components/mcps/mcps-listing-switch";
import { getMCPBySlug } from "@/data/queries";
import { getSession } from "@/utils/supabase/auth";

type Params = Promise<{ slug: string }>;

export const metadata: Metadata = {
  title: "Edit MCP | Cursor Directory",
  description: "Edit your MCP server on Cursor Directory.",
};

/**
 * Owner-gated editor: session and `params` access stream inside the page's
 * Suspense boundary so the route keeps a prerendered static shell.
 */
async function EditMCPContent({ params }: { params: Params }) {
  const { slug } = await params;
  const session = await getSession();
  const { data: mcp } = await getMCPBySlug(slug);

  if (!session) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <Login redirectTo={`/mcp/${slug}/edit`} />
        </div>
      </div>
    );
  }

  if (mcp?.owner_id !== session.user.id) {
    redirect("/mcp");
  }

  return (
    <div className="page-shell pb-16 pt-24 md:pt-32">
      <div className="mx-auto max-w-screen-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="marketing-page-title">Edit MCP</h1>
          <MCPListingSwitch id={mcp.id} active={mcp.active} />
        </div>

        <EditMCPForm data={mcp} />
      </div>
    </div>
  );
}

export default function Page({ params }: { params: Params }) {
  return (
    <Suspense fallback={null}>
      <EditMCPContent params={params} />
    </Suspense>
  );
}
