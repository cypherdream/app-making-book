import { useRef, useCallback } from 'react';

/**
 * Returns touch handlers to spread onto a container. Fires onSwipeLeft
 * / onSwipeRight once a horizontal drag exceeds `threshold` px, so an
 * ordinary tap or vertical scroll isn't mistaken for a swipe.
 */
export function useSwipe({ onSwipeLeft, onSwipeRight, threshold = 60 }) {
  const startX = useRef(null);

  const onTouchStart = useCallback((e) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (startX.current == null) return;
    const delta = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(delta) > threshold) {
      if (delta < 0) onSwipeLeft?.();
      else onSwipeRight?.();
    }
    startX.current = null;
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchEnd };
}
