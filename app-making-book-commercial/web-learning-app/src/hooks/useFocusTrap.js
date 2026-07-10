import { useEffect, useRef } from 'react';

/**
 * Traps Tab/Shift+Tab focus inside a modal and restores focus to
 * whatever triggered it on close. Without this, a keyboard user could
 * Tab straight out of an open modal into the page behind it — a real
 * accessibility gap, not a nice-to-have.
 */
export function useFocusTrap(active) {
  const containerRef = useRef(null);
  const triggerElementRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    triggerElementRef.current = document.activeElement;

    const container = containerRef.current;
    const focusable = container?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.[0]?.focus();

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab' || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container?.addEventListener('keydown', handleKeyDown);
    return () => {
      container?.removeEventListener('keydown', handleKeyDown);
      triggerElementRef.current?.focus?.();
    };
  }, [active]);

  return containerRef;
}
