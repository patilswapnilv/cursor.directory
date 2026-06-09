"use client";

import { CopyButton } from "./copy-button";
import {
  buildComponentDeepLink,
  type DeepLinkKind,
  MAX_DEEPLINK_URL_LENGTH,
} from "./deeplinks";

const KIND_LABELS: Record<DeepLinkKind, string> = {
  rule: "Rule",
  command: "Command",
};

/**
 * "Add to Cursor" deeplink for a rule/command component, falling back to a
 * copy-to-clipboard button when the content is too large for a reliable
 * `cursor://` URL.
 */
export function AddToCursorOrCopy({
  kind,
  slug,
  content,
  onInstall,
}: {
  kind: DeepLinkKind;
  slug: string;
  content: string;
  onInstall: () => void;
}) {
  const deepLink = buildComponentDeepLink(kind, slug, content);

  if (deepLink.length > MAX_DEEPLINK_URL_LENGTH) {
    return (
      <CopyButton
        text={content}
        onCopy={onInstall}
        title={`${KIND_LABELS[kind]} too large to install via deeplink — copy and paste into Cursor`}
      />
    );
  }

  return (
    <a
      href={deepLink}
      className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      onClick={onInstall}
    >
      Add to Cursor
    </a>
  );
}
