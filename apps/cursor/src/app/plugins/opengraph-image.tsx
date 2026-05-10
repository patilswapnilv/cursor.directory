import { createListingOG, OG } from "@/lib/og";

export const alt = "Plugins";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return createListingOG(
    "Plugins",
    "Rules, MCP servers, and integrations built by the community",
  );
}
