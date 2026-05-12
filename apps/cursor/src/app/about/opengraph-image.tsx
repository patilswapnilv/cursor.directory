import { createListingOG, OG } from "@/lib/og";

export const alt = "About";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return createListingOG("About", "About Cursor Directory");
}
