import { X } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

const SHORTCUTS = [
  ['/', 'Focus search'],
  ['↑ / ↓', 'Previous / next lesson'],
  ['D', 'Toggle dark mode'],
  ['R', 'Toggle reading mode'],
  ['Esc', 'Close dialogs'],
  ['?', 'Show this list'],
];

export default function ShortcutsModal({ onClose }) {
  const modalRef = useFocusTrap(true);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-5 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Keyboard shortcuts</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={16} className="text-[var(--text-muted)]" />
          </button>
        </div>
        <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
          {SHORTCUTS.map(([k, d]) => (
            <li key={k} className="flex justify-between">
              <kbd className="px-1.5 py-0.5 bg-[var(--bg-hover)] rounded font-mono text-[11px]">{k}</kbd>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
