// Input: items array, container ref, estimated item height, overscan count
// Output: visible items slice with offsets, spacer heights, scroll handler, total height
// Pos: hooks layer -- used by PdSidebar (session list) and PdMessageList (message list)
//
// "一旦我被修改，请更新我的头部注释，以及所属文件夹的md。"

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------
export interface UseVirtualListOptions<T> {
  /** Full items array to virtualize */
  items: T[];
  /** Ref to the scrollable container element */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Estimated height (px) for each item when actual height is unknown */
  estimatedItemHeight: number;
  /** Extra items to render above/below the visible window (default: 5) */
  overscan?: number;
  /** Whether to enable virtualization (pass false to bypass entirely) */
  enabled?: boolean;
}

export interface VirtualItem<T> {
  item: T;
  index: number;
  offsetTop: number;
}

export interface UseVirtualListResult<T> {
  /** Items currently visible (+ overscan) with their computed offsets */
  virtualItems: VirtualItem<T>[];
  /** Total estimated height of all items (for container sizing) */
  totalHeight: number;
  /** Top spacer height to offset the visible slice */
  paddingTop: number;
  /** Bottom spacer height */
  paddingBottom: number;
  /** Attach to container's onScroll */
  onScroll: (e: React.UIEvent) => void;
}

// ---------------------------------------------------------------------------
// Hook implementation
// ---------------------------------------------------------------------------
export function useVirtualList<T>(options: UseVirtualListOptions<T>): UseVirtualListResult<T> {
  const { items, containerRef, estimatedItemHeight, overscan = 5, enabled = true } = options;

  // Height cache: index -> measured or estimated height
  const heightCache = useRef<Map<number, number>>(new Map());

  // Scroll state
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // ── Observe container resize ──────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !enabled) return;

    setContainerHeight(el.clientHeight);

    if (typeof ResizeObserver === 'undefined') return; // fallback: use initial value

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, enabled]);

  // ── Scroll handler ────────────────────────────────────────────────────
  const onScroll = useCallback((e: React.UIEvent) => {
    if (!enabled) return;
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, [enabled]);

  // ── Compute visible range ─────────────────────────────────────────────
  const result = useMemo<UseVirtualListResult<T>>(() => {
    const count = items.length;

    // Not enabled or empty: return all items with no virtualization
    if (!enabled || count === 0) {
      return {
        virtualItems: items.map((item, index) => ({ item, index, offsetTop: 0 })),
        totalHeight: 0,
        paddingTop: 0,
        paddingBottom: 0,
        onScroll,
      };
    }

    // Build cumulative offsets
    const offsets: number[] = new Array(count);
    let cumulative = 0;
    for (let i = 0; i < count; i++) {
      offsets[i] = cumulative;
      cumulative += heightCache.current.get(i) ?? estimatedItemHeight;
    }
    const totalHeight = cumulative;

    // Find start index via binary search
    let lo = 0;
    let hi = count - 1;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      const itemBottom = offsets[mid] + (heightCache.current.get(mid) ?? estimatedItemHeight);
      if (itemBottom <= scrollTop) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    const visibleStart = lo;

    // Find end index
    const viewBottom = scrollTop + containerHeight;
    let visibleEnd = visibleStart;
    while (visibleEnd < count && offsets[visibleEnd] < viewBottom) {
      visibleEnd++;
    }

    // Apply overscan
    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(count, visibleEnd + overscan);

    // Build virtual items
    const virtualItems: VirtualItem<T>[] = [];
    for (let i = startIndex; i < endIndex; i++) {
      virtualItems.push({
        item: items[i],
        index: i,
        offsetTop: offsets[i],
      });
    }

    const paddingTop = offsets[startIndex] ?? 0;
    const lastIdx = endIndex - 1;
    const paddingBottom = lastIdx < count - 1
      ? totalHeight - (offsets[lastIdx] + (heightCache.current.get(lastIdx) ?? estimatedItemHeight))
      : 0;

    return {
      virtualItems,
      totalHeight,
      paddingTop,
      paddingBottom,
      onScroll,
    };
  }, [items, enabled, scrollTop, containerHeight, estimatedItemHeight, overscan, onScroll]);

  return result;
}

// ---------------------------------------------------------------------------
// Utility: measure and cache an item's actual height via callback ref
// ---------------------------------------------------------------------------
export function useMeasureItem(
  heightCache: React.MutableRefObject<Map<number, number>>,
  index: number,
): (node: HTMLElement | null) => void {
  return useCallback(
    (node: HTMLElement | null) => {
      if (node) {
        const height = node.getBoundingClientRect().height;
        if (height > 0) {
          heightCache.current.set(index, height);
        }
      }
    },
    [heightCache, index],
  );
}
