import "server-only";

import { checkRateLimit } from "@vercel/firewall";
import { headers } from "next/headers";

/**
 * Rate limits live in the Vercel Firewall dashboard. Each `rateLimitId` below
 * must have a matching `@vercel/firewall` rule configured with the window and
 * threshold listed in the comment. Code only owns the *key shape* — the limit
 * itself is changed in the dashboard.
 *
 * Required dashboard rules:
 *   install-per-plugin   3 requests / 24h   (key: `${ip}:${pluginId}`)
 *   install-global       20 requests / 1h   (key: ip, default)
 *   plugin-scan          5 requests / 1h    (key: userId)
 *
 * In non-production, `checkRateLimit` is a no-op unless
 * `NEXT_PUBLIC_VERCEL_FIREWALL_HOST_FOR_DEVELOPMENT` is set to a deployed host
 * (e.g. your preview URL).
 */
const RATE_LIMIT_IDS = {
  installPerPlugin: "install-per-plugin",
  installGlobal: "install-global",
  pluginScan: "plugin-scan",
} as const;

const firewallHostForDevelopment =
  process.env.NEXT_PUBLIC_VERCEL_FIREWALL_HOST_FOR_DEVELOPMENT;

type LimitResult = { success: boolean };

async function getRequestHeaders(): Promise<Headers> {
  return new Headers(await headers());
}

function getIpFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "unknown"
  );
}

async function check(
  rateLimitId: string,
  rateLimitKey?: string,
): Promise<LimitResult> {
  const requestHeaders = await getRequestHeaders();
  const { rateLimited } = await checkRateLimit(rateLimitId, {
    headers: requestHeaders,
    rateLimitKey,
    firewallHostForDevelopment,
  });
  return { success: !rateLimited };
}

export async function installPerPluginLimit(
  pluginId: string,
): Promise<LimitResult> {
  const requestHeaders = await getRequestHeaders();
  const ip = getIpFromHeaders(requestHeaders);
  const { rateLimited } = await checkRateLimit(
    RATE_LIMIT_IDS.installPerPlugin,
    {
      headers: requestHeaders,
      rateLimitKey: `${ip}:${pluginId}`,
      firewallHostForDevelopment,
    },
  );
  return { success: !rateLimited };
}

export async function installGlobalLimit(): Promise<LimitResult> {
  return check(RATE_LIMIT_IDS.installGlobal);
}

export async function pluginScanLimit(userId: string): Promise<LimitResult> {
  return check(RATE_LIMIT_IDS.pluginScan, userId);
}
