import { useEffect } from 'react';

/**
 * handlers: { onSearch, onEscape, onToggleDark, onToggleReading, onShowHelp, onNext, onPrev }
 */
export function useKeyboardShortcuts(handlers) {
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === '/' && !typing) {
        e.preventDefault();
        handlers.onSearch?.();
      } else if (e.key === 'Escape') {
        if (typing) document.activeElement.blur();
        handlers.onEscape?.();
      } else if (!typing && (e.key === 'd' || e.key === 'D')) {
        handlers.onToggleDark?.();
      } else if (!typing && (e.key === 'r' || e.key === 'R')) {
        handlers.onToggleReading?.();
      } else if (!typing && e.key === '?') {
        handlers.onShowHelp?.();
      } else if (!typing && e.key === 'ArrowDown') {
        e.preventDefault();
        handlers.onNext?.();
      } else if (!typing && e.key === 'ArrowUp') {
        e.preventDefault();
        handlers.onPrev?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}
