import { createListingOG, OG } from "@/lib/og";

export const alt = "Members";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return createListingOG(
    "Members",
    "Thousands of developers and companies building with Cursor",
  );
}
