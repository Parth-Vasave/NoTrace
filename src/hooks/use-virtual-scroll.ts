import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  estimatedItemHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  estimatedItemHeight,
  overscan = 5,
}: UseVirtualScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: itemCount });

  const updateVisibleRange = useCallback(() => {
    const container = containerRef.current;
    if (!container || itemCount === 0) {
      setVisibleRange({ start: 0, end: itemCount });
      return;
    }

    const scrollTop = container.scrollTop;
    const viewportHeight = container.clientHeight;

    const start = Math.max(0, Math.floor(scrollTop / estimatedItemHeight) - overscan);
    const visibleCount = Math.ceil(viewportHeight / estimatedItemHeight) + overscan * 2;
    const end = Math.min(itemCount, start + visibleCount);

    setVisibleRange({ start, end });
  }, [itemCount, estimatedItemHeight, overscan]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Update on scroll
    container.addEventListener('scroll', updateVisibleRange, { passive: true });
    updateVisibleRange();

    return () => container.removeEventListener('scroll', updateVisibleRange);
  }, [updateVisibleRange]);

  // When item count changes (new message), show the latest
  useEffect(() => {
    setVisibleRange(prev => ({
      start: prev.start,
      end: itemCount,
    }));
  }, [itemCount]);

  const topPadding = visibleRange.start * estimatedItemHeight;
  const bottomPadding = Math.max(0, (itemCount - visibleRange.end) * estimatedItemHeight);

  return {
    containerRef,
    visibleRange,
    topPadding,
    bottomPadding,
  };
}
