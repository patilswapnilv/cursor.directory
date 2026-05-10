/**
 * Phase 1 of the directory seed: discover repos that follow Cursor's official
 * plugin spec (`.cursor-plugin/plugin.json` and `.cursor-plugin/marketplace.json`),
 * parse each one, and write the result to a JSONL file.
 *
 * No DB writes. Re-runnable. Inspect the output before running phase 2.
 *
 * Usage:
 *   bun run --env-file=apps/cursor/.env apps/cursor/src/scripts/extract-from-github.ts \
 *     [--limit 1000] \
 *     [--include-marketplace true|false] \
 *     [--output apps/cursor/.seed/plugins.jsonl] \
 *     [--resume]
 *
 * Requires GITHUB_TOKEN in env (Code Search needs auth).
 */

import { createWriteStream, existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  fetchGitHubRepoMeta,
  GitHubParseError,
  type GitHubRepoMeta,
  type ParsedPlugin,
  parseGitHubPlugin,
} from "@/lib/github-plugin/parse";

type Source =
  | "seed:cursor-spec"
  | "seed:cursor-marketplace"
  | "seed:cursor-org";

type Candidate = {
  owner: string;
  repo: string;
  source: Source;
  matchedQuery: string;
};

type ExtractedRow = {
  github_repo_id: number;
  discovery_source: Source;
  stars: number;
  license: string | null;
  parsed: ParsedPlugin;
};

type Args = {
  limit: number;
  includeMarketplace: boolean;
  output: string;
  resume: boolean;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {
    limit: Number.POSITIVE_INFINITY,
    includeMarketplace: true,
    output: "apps/cursor/.seed/plugins.jsonl",
    resume: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "--include-marketplace") {
      const v = argv[++i];
      out.includeMarketplace = v !== "false" && v !== "0";
    } else if (a === "--output") out.output = argv[++i];
    else if (a === "--resume") out.resume = true;
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: extract-from-github.ts [--limit N] [--include-marketplace true|false] [--output path] [--resume]",
      );
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(1);
    }
  }
  return out;
}

function authHeaders(): Record<string, string> {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error(
      "GITHUB_TOKEN env var is required (Code Search endpoints need auth).",
    );
  }
  return { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function githubCodeSearch(
  query: string,
  source: Source,
): Promise<Candidate[]> {
  const out: Candidate[] = [];
  const PER_PAGE = 100;
  // GitHub Code Search caps results at 1,000 (10 pages of 100).
  const MAX_PAGES = 10;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=${PER_PAGE}&page=${page}`;
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github.v3+json",
        ...authHeaders(),
      },
    });

    if (res.status === 403 || res.status === 429) {
      const retry = Number(res.headers.get("retry-after") ?? "30");
      console.warn(`code search rate-limited, sleeping ${retry}s`);
      await sleep(retry * 1000);
      page--; // retry same page
      continue;
    }
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `code search failed for "${query}": ${res.status} ${res.statusText} ${body.slice(0, 200)}`,
      );
    }

    const data = (await res.json()) as {
      total_count?: number;
      incomplete_results?: boolean;
      items?: Array<{
        repository?: { full_name?: string };
      }>;
    };

    if (page === 1) {
      console.log(
        `  query "${query}": total_count=${data.total_count ?? 0}, fetching up to ${MAX_PAGES * PER_PAGE}`,
      );
    }

    const items = data.items ?? [];
    for (const item of items) {
      const fullName = item.repository?.full_name;
      if (!fullName) continue;
      const [owner, repo] = fullName.split("/");
      if (!owner || !repo) continue;
      out.push({ owner, repo, source, matchedQuery: query });
    }

    if (items.length < PER_PAGE) break;

    // Code Search rate limit: 30 req/min authed. Pace ourselves.
    await sleep(2000);
  }

  return out;
}

async function fetchCursorOrgPlugins(): Promise<Candidate[]> {
  // Always include the official cursor/plugins org as the curated baseline.
  // The repo itself will be parsed (multi-plugin marketplace), so a single
  // candidate suffices.
  return [
    {
      owner: "cursor",
      repo: "plugins",
      source: "seed:cursor-org",
      matchedQuery: "cursor/plugins",
    },
  ];
}

async function scrapeCursorMarketplace(): Promise<Candidate[]> {
  const res = await fetch("https://cursor.com/marketplace", {
    cache: "no-store",
  });
  if (!res.ok) {
    console.warn(
      `cursor.com/marketplace scrape failed: ${res.status} ${res.statusText}`,
    );
    return [];
  }
  const html = await res.text();
  const matches = html.matchAll(
    /github\.com\/([a-z0-9][a-z0-9-]*)\/([a-z0-9._-]+)/gi,
  );
  const seen = new Set<string>();
  const out: Candidate[] = [];
  for (const m of matches) {
    const owner = m[1];
    const repo = m[2].replace(/\.git$/i, "");
    const key = `${owner}/${repo}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      owner,
      repo,
      source: "seed:cursor-marketplace",
      matchedQuery: "cursor.com/marketplace",
    });
  }
  return out;
}

async function loadResumeIds(output: string): Promise<Set<number>> {
  if (!existsSync(output)) return new Set();
  const ids = new Set<number>();
  const text = await readFile(output, "utf8");
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line);
      if (typeof row.github_repo_id === "number") {
        ids.add(row.github_repo_id);
      }
    } catch {
      // ignore
    }
  }
  return ids;
}

async function main() {
  const args = parseArgs();
  console.log("Args:", args);

  await mkdir(dirname(args.output), { recursive: true });

  const candidates = new Map<string, Candidate>();

  console.log("Discovering candidates...");
  const orgCandidates = await fetchCursorOrgPlugins();
  for (const c of orgCandidates) {
    candidates.set(`${c.owner}/${c.repo}`.toLowerCase(), c);
  }
  console.log(`  cursor org: +${orgCandidates.length}`);

  if (args.includeMarketplace) {
    const mkCandidates = await scrapeCursorMarketplace();
    let added = 0;
    for (const c of mkCandidates) {
      const key = `${c.owner}/${c.repo}`.toLowerCase();
      if (!candidates.has(key)) {
        candidates.set(key, c);
        added++;
      }
    }
    console.log(`  cursor marketplace: +${added} (of ${mkCandidates.length})`);
  }

  const codeQueries = [
    "path:.cursor-plugin/plugin.json",
    "path:.cursor-plugin/marketplace.json",
  ];
  for (const q of codeQueries) {
    const found = await githubCodeSearch(q, "seed:cursor-spec");
    let added = 0;
    for (const c of found) {
      const key = `${c.owner}/${c.repo}`.toLowerCase();
      if (!candidates.has(key)) {
        candidates.set(key, c);
        added++;
      }
    }
    console.log(`  code search: +${added} (of ${found.length})`);
  }

  console.log(`Total unique candidates: ${candidates.size}`);

  const resumeIds = args.resume ? await loadResumeIds(args.output) : new Set();
  if (args.resume) {
    console.log(`Resume: skipping ${resumeIds.size} already-extracted repos.`);
  }

  const outStream = createWriteStream(args.output, {
    flags: args.resume ? "a" : "w",
  });
  const failedStream = createWriteStream(`${args.output}.failed.jsonl`, {
    flags: args.resume ? "a" : "w",
  });

  const summary = {
    total_candidates: candidates.size,
    after_filter: 0,
    parsed_ok: 0,
    parse_failed: 0,
    skipped_fork: 0,
    skipped_archived: 0,
    skipped_unreadable: 0,
    skipped_resume: 0,
    by_source: {} as Record<string, number>,
    by_component_type: {} as Record<string, number>,
  };

  let processed = 0;
  for (const [key, candidate] of candidates) {
    if (processed >= args.limit) break;
    processed++;

    const url = `https://github.com/${candidate.owner}/${candidate.repo}`;
    const prefix = `[${processed}/${Math.min(candidates.size, args.limit)}] ${key}`;

    let meta: GitHubRepoMeta | null;
    try {
      meta = await fetchGitHubRepoMeta(candidate.owner, candidate.repo);
    } catch (err) {
      console.warn(
        `${prefix} repo meta fetch failed: ${err instanceof Error ? err.message : err}`,
      );
      summary.skipped_unreadable++;
      failedStream.write(
        `${JSON.stringify({
          url,
          source: candidate.source,
          reason: "meta_fetch_failed",
        })}\n`,
      );
      continue;
    }

    if (!meta) {
      console.warn(`${prefix} repo not found / private`);
      summary.skipped_unreadable++;
      failedStream.write(
        `${JSON.stringify({
          url,
          source: candidate.source,
          reason: "repo_not_found",
        })}\n`,
      );
      continue;
    }

    if (meta.fork) {
      console.log(`${prefix} skip: fork`);
      summary.skipped_fork++;
      continue;
    }
    if (meta.archived) {
      console.log(`${prefix} skip: archived`);
      summary.skipped_archived++;
      continue;
    }

    if (resumeIds.has(meta.id)) {
      summary.skipped_resume++;
      continue;
    }

    summary.after_filter++;

    let parsed: ParsedPlugin;
    try {
      parsed = await parseGitHubPlugin(url, { repoMeta: meta });
    } catch (err) {
      const reason =
        err instanceof GitHubParseError ? err.code : "unknown_error";
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`${prefix} parse failed: ${reason} - ${message}`);
      summary.parse_failed++;
      failedStream.write(
        `${JSON.stringify({
          url,
          source: candidate.source,
          github_repo_id: meta.id,
          stars: meta.stars,
          reason,
          message,
        })}\n`,
      );
      continue;
    }

    const row: ExtractedRow = {
      github_repo_id: meta.id,
      discovery_source: candidate.source,
      stars: meta.stars,
      license: meta.license_spdx,
      parsed,
    };
    outStream.write(`${JSON.stringify(row)}\n`);

    summary.parsed_ok++;
    summary.by_source[candidate.source] =
      (summary.by_source[candidate.source] ?? 0) + 1;
    for (const comp of parsed.components) {
      summary.by_component_type[comp.type] =
        (summary.by_component_type[comp.type] ?? 0) + 1;
    }

    console.log(
      `${prefix} ok: ${parsed.components.length} components (${parsed.name})`,
    );

    // Be polite to GitHub raw + git/trees endpoints.
    await sleep(150);
  }

  await new Promise<void>((r) => outStream.end(() => r()));
  await new Promise<void>((r) => failedStream.end(() => r()));

  await writeFile(
    `${args.output}.summary.json`,
    `${JSON.stringify(summary, null, 2)}\n`,
  );

  console.log("\nSummary:");
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nWrote: ${args.output}`);
  console.log(`Failed log: ${args.output}.failed.jsonl`);
  console.log(`Summary: ${args.output}.summary.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
