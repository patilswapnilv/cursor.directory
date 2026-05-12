import { createListingOG, OG } from "@/lib/og";

export const alt = "Submit a Plugin";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return createListingOG(
    "Submit a Plugin",
    "Share your Cursor plugin with the community",
  );
}
