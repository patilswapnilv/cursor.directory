import { OG, ogResponse, renderListingOGBytes } from "@/lib/og";

export const alt = "Members";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return ogResponse(
    await renderListingOGBytes(
      "Members",
      "Thousands of developers and companies building with Cursor",
    ),
  );
}
