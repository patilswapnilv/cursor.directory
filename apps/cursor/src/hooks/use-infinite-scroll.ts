import { useEffect, useRef } from "react";

export function useInfiniteScroll(
  onLoadMore: () => void,
  enabled: boolean,
  /** Changes when more items are shown; re-observes so loading continues if the sentinel stays in view. */
  loadedCount = 0,
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onLoadMore, enabled, loadedCount]);

  return sentinelRef;
}
