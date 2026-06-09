import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  cacheComponents: true,
  turbopack: {
    root: resolve(__dirname, "../.."),
  },
  serverExternalPackages: ["@cursor/sdk"],
  redirects: async () => {
    return [
      {
        source: "/plugins",
        destination: "/",
        permanent: true,
      },
      {
        source: "/popular",
        destination: "/",
        permanent: true,
      },
      {
        source: "/rules",
        destination: "/",
        permanent: true,
      },
      {
        source: "/rules/:path*",
        destination: "/plugins/:path*",
        permanent: true,
      },
      {
        source: "/mcp",
        destination: "/",
        permanent: true,
      },
      {
        // Legacy MCP detail URLs map to their plugin page. Excludes `new`,
        // which is the MCP submission form route. Edit pages (`/mcp/x/edit`)
        // are two segments deep and never match this single-segment source.
        source: "/mcp/:slug((?!new$)[^/]+)",
        destination: "/plugins/mcp-:slug",
        permanent: true,
      },
      {
        source: "/official/:path*",
        destination: "/",
        permanent: true,
      },
      {
        source: "/generate",
        destination: "/",
        permanent: true,
      },
      {
        source: "/companies",
        destination: "/members?tab=companies",
        permanent: true,
      },
      {
        source: "/companies/:slug",
        destination: "/c/:slug",
        permanent: true,
      },
      {
        source: "/jobs",
        destination: "https://cursor.com/careers",
        permanent: true,
      },
      {
        source: "/jobs/:path*",
        destination: "https://cursor.com/careers",
        permanent: true,
      },
      {
        source: "/events",
        destination: "https://cursor.com/community",
        permanent: true,
      },
      {
        source: "/events/:path*",
        destination: "https://cursor.com/community",
        permanent: true,
      },
      {
        source: "/board",
        destination: "https://forum.cursor.com",
        permanent: true,
      },
      {
        source: "/board/:path*",
        destination: "https://forum.cursor.com",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        hostname: "cdn.brandfetch.io",
      },
      {
        hostname: "pbs.twimg.com",
      },
      {
        hostname: "midday.ai",
      },
      {
        hostname: "pub-abe1cd4008f5412abb77357f87d7d7bb.r2.dev",
      },
      {
        hostname: "avatars.githubusercontent.com",
      },
      {
        hostname: "knhgkaawjfqqwmsgmxns.supabase.co",
      },
      {
        hostname: "service.cursor.directory",
      },
      {
        hostname: "console.settlemint.com",
      },
      {
        hostname: "assets.serverless-extras.com",
      },
      {
        hostname: "images.lumacdn.com",
      },
    ],
  },
};

export default nextConfig;
