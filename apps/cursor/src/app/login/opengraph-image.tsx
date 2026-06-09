import { OG, ogResponse, renderListingOGBytes } from "@/lib/og";

export const alt = "Sign In";
export const size = { width: OG.width, height: OG.height };
export const contentType = "image/png";

export default async function Image() {
  return ogResponse(
    await renderListingOGBytes("Sign In", "Sign in to Cursor Directory"),
  );
}
