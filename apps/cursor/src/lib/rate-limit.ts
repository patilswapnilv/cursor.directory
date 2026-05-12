import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

// Per IP + plugin: max 3 installs per 24h for the same plugin
export const installPerPluginRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "24 h"),
  prefix: "ratelimit:install:plugin",
});

// Per IP globally: max 20 installs per hour across all plugins
export const installGlobalRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "ratelimit:install:global",
});

// Per user: bound how many plugin submissions/edits can trigger a security
// scan in an hour. Cursor SDK calls cost real money and time; this prevents
// a single account from exhausting the budget by spamming submits.
export const pluginScanRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ratelimit:plugin:scan",
});
