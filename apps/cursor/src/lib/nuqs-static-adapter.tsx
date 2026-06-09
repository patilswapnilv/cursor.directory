"use client";

/**
 * nuqs adapter for fully prerendered pages under Cache Components.
 *
 * The official `nuqs/adapters/next/app` adapter reads Next's
 * `useSearchParams()`, which is runtime request data when `cacheComponents`
 * is enabled — every `useQueryState` consumer suspends during prerendering
 * and falls back to its Suspense boundary, punching holes in the static
 * shell (e.g. the homepage leaderboard vanished from the prerendered HTML).
 *
 * All nuqs state in this app is client-only UI state (search filters, tabs,
 * modal flags — nothing uses `shallow: false` to notify the server), so this
 * adapter skips Next's router entirely:
 *
 * - Server/prerender: every param reads as its default value, so pages
 *   render complete static HTML.
 * - Client: state syncs from `location.search` right after hydration (via
 *   `useSyncExternalStore`, so landing on `/?q=foo` upgrades without a
 *   hydration mismatch) and stays in sync with history updates, including
 *   Next.js router navigations like `<Link href="/?q=react">`.
 */

import {
  type unstable_AdapterInterface as AdapterInterface,
  unstable_createAdapterProvider as createAdapterProvider,
  renderQueryString,
} from "nuqs/adapters/custom";
import { useCallback, useMemo, useSyncExternalStore } from "react";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

let historyPatched = false;

/**
 * Patch pushState/replaceState so external URL updates (Next.js router
 * navigations, third-party code) also notify subscribers. Deferred to a
 * microtask: the router calls these mid-render-commit, and notifying
 * synchronously would trigger setState-during-render warnings.
 */
function patchHistoryOnce() {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;

  for (const method of ["pushState", "replaceState"] as const) {
    const original = window.history[method].bind(window.history);
    window.history[method] = (...args) => {
      original(...args);
      queueMicrotask(emit);
    };
  }
}

function subscribe(callback: () => void) {
  patchHistoryOnce();
  listeners.add(callback);
  window.addEventListener("popstate", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("popstate", callback);
  };
}

const getSnapshot = () => window.location.search;
const getServerSnapshot = () => "";

function useStaticAdapter(): AdapterInterface {
  const search = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const searchParams = useMemo(() => new URLSearchParams(search), [search]);

  const updateUrl: AdapterInterface["updateUrl"] = useCallback(
    (newSearchParams, options) => {
      const url = new URL(window.location.href);
      url.search = renderQueryString(newSearchParams);

      const method =
        options.history === "push"
          ? window.history.pushState
          : window.history.replaceState;
      // The patched method emits to all subscribers.
      method.call(window.history, window.history.state, "", url);

      if (options.scroll) window.scrollTo(0, 0);
    },
    [],
  );

  return { searchParams, updateUrl };
}

export const NuqsAdapter = createAdapterProvider(useStaticAdapter);
