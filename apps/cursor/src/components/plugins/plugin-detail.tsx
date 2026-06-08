"use client";

import { Download, Pencil } from "lucide-react";
import Link from "next/link";
import { useAction } from "next-safe-action/hooks";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { trackInstallAction } from "@/actions/track-install";
import { ExternalLinkIcon } from "@/components/icons/external-link-icon";
import {
  COMPONENT_TYPE_LABELS_PLURAL,
  type ComponentType,
  type PluginRow,
} from "@/lib/plugins/types";
import { cn, formatCount } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import { GenericComponentSection } from "./detail/generic-component-section";
import { McpSection } from "./detail/mcp-section";
import { PluginLogo } from "./detail/plugin-logo";
import { RulesSection } from "./detail/rules-section";
import { ScanStatusBanner } from "./detail/scan-status-banner";
import { StarButton } from "./star-button";
import { VerifiedBadge } from "./verified-badge";
import { VerifyControls } from "./verify-controls";

export function PluginDetailView({ plugin }: { plugin: PluginRow }) {
  const [isOwner, setIsOwner] = useState(false);
  const [installCount, setInstallCount] = useState(plugin.install_count);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && plugin.owner_id === session.user.id) {
        setIsOwner(true);
      }
    });
  }, [plugin.owner_id]);

  const { execute: trackInstall } = useAction(trackInstallAction, {
    onSuccess: ({ data }) => {
      if (data?.tracked) {
        setInstallCount((c) => c + 1);
      } else if (data?.rateLimited) {
        toast("Too many installs right now. Please try again in a bit.");
      }
    },
  });

  const handleInstall = useCallback(() => {
    trackInstall({ pluginId: plugin.id, slug: plugin.slug });
  }, [plugin.id, plugin.slug, trackInstall]);

  const components = plugin.plugin_components ?? [];
  const componentTypes = [...new Set(components.map((c) => c.type))];
  const [activeTab, setActiveTab] = useState<ComponentType>(
    componentTypes[0] ?? "rule",
  );

  const rules = components.filter((c) => c.type === "rule");
  const mcps = components.filter((c) => c.type === "mcp_server");
  const activeComponents = components.filter((c) => c.type === activeTab);

  const [expandedRule, setExpandedRule] = useState<string | null>(
    rules[0]?.slug ?? null,
  );
  const [expandedMcp, setExpandedMcp] = useState<string | null>(
    mcps[0]?.slug ?? null,
  );

  // Component content stays visible for inactive plugins so owners can review;
  // only one-click install is hidden.
  const installable = plugin.active === true;

  return (
    <div className="min-h-screen px-4 pt-24 md:pt-32">
      <div className="page-shell max-w-4xl px-0 py-8">
        <ScanStatusBanner plugin={plugin} isOwner={isOwner} />
        <div className="mb-6 flex items-center gap-4">
          <PluginLogo logo={plugin.logo} name={plugin.name} size={40} />
          <div className="flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <h1 className="text-3xl font-semibold tracking-tight">
                  {plugin.name}
                </h1>
                {plugin.verified && <VerifiedBadge size="md" />}
              </div>
              <div className="flex items-center gap-2">
                <VerifyControls plugin={plugin} />
                <span className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground">
                  <Download className="size-3.5" />
                  <span className="text-xs">{formatCount(installCount)}</span>
                </span>
                {isOwner && (
                  <Link
                    href={`/plugins/${plugin.slug}/edit`}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Link>
                )}
                <StarButton
                  pluginId={plugin.id}
                  slug={plugin.slug}
                  starCount={plugin.star_count}
                />
              </div>
            </div>
            {plugin.author_name && (
              <p className="mt-1 text-sm text-muted-foreground">
                by{" "}
                {plugin.author_url ? (
                  <Link
                    href={plugin.author_url}
                    target="_blank"
                    className="border-b border-dashed border-input text-foreground"
                  >
                    {plugin.author_name}
                  </Link>
                ) : (
                  plugin.author_name
                )}
              </p>
            )}
          </div>
        </div>

        <p className="mb-8 max-w-2xl text-[15px] leading-7 text-muted-foreground">
          {plugin.description}
        </p>

        <div className="mb-10 flex items-center gap-4">
          {plugin.homepage && (
            <Link
              href={plugin.homepage}
              target="_blank"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span>Homepage</span>
              <ExternalLinkIcon />
            </Link>
          )}
          {plugin.repository && (
            <Link
              href={plugin.repository}
              target="_blank"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <span>Source</span>
              <ExternalLinkIcon />
            </Link>
          )}
        </div>

        {plugin.keywords.length > 0 && (
          <div className="mb-10 flex flex-wrap gap-2">
            {plugin.keywords.map((kw) => (
              <Link
                key={kw}
                href={`/?q=${encodeURIComponent(kw)}`}
                className="rounded-md border border-border bg-muted px-2 py-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
              >
                {kw}
              </Link>
            ))}
          </div>
        )}

        {componentTypes.length > 1 && (
          <div className="mb-6 flex items-center gap-2">
            {componentTypes.map((type) => {
              const count = components.filter((c) => c.type === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  className={cn(
                    "rounded-full border border-border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    activeTab === type && "bg-accent text-foreground",
                  )}
                  onClick={() => setActiveTab(type)}
                >
                  {COMPONENT_TYPE_LABELS_PLURAL[type]} ({count})
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "rule" && rules.length > 0 && (
          <RulesSection
            rules={rules}
            expandedRule={expandedRule}
            setExpandedRule={setExpandedRule}
            onInstall={handleInstall}
            installable={installable}
          />
        )}

        {activeTab === "mcp_server" && mcps.length > 0 && (
          <McpSection
            mcps={mcps}
            onInstall={handleInstall}
            installable={installable}
            expandedMcp={expandedMcp}
            setExpandedMcp={setExpandedMcp}
          />
        )}

        {activeTab !== "rule" &&
          activeTab !== "mcp_server" &&
          activeComponents.length > 0 && (
            <GenericComponentSection
              components={activeComponents}
              type={activeTab}
              onInstall={handleInstall}
              installable={installable}
            />
          )}
      </div>
    </div>
  );
}
