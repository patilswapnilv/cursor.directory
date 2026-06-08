/**
 * Builders for `cursor://` install deeplinks used on the plugin detail page.
 */

// Beyond this URL length, the cursor:// deeplink is unreliable: OS protocol
// handlers and/or Cursor's URL parser silently drop or truncate the URL,
// causing the editor to either no-op or throw "URI malformed" on its
// decodeURIComponent call. Above the threshold we fall back to copy-to-clipboard
// instead of a broken Add to Cursor button. See community-plugins#363.
export const MAX_DEEPLINK_URL_LENGTH = 8000;

/** Component kinds installable via a `name` + `text` deeplink. */
export type DeepLinkKind = "rule" | "command";

export function buildComponentDeepLink(
  kind: DeepLinkKind,
  name: string,
  content: string,
) {
  return `cursor://anysphere.cursor-deeplink/${kind}?name=${encodeURIComponent(name)}&text=${encodeURIComponent(content)}`;
}

function toBase64(input: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(input, "utf-8").toString("base64");
  }
  // Browser fallback: btoa only accepts Latin-1, so round-trip through UTF-8 first.
  return btoa(
    encodeURIComponent(input).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    ),
  );
}

export function buildMCPInstallDeepLink(name: string, config: string) {
  // `+` in a query string decodes to a space, so the base64 must be
  // URL-encoded or Cursor base64-decodes garbage and throws "Not valid JSON".
  return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(name)}&config=${encodeURIComponent(toBase64(config))}`;
}
