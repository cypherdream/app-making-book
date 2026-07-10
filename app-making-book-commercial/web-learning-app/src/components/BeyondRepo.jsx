import { ChevronRight } from 'lucide-react';
import { BEYOND_REPO } from '../data/beyondRepo';

export default function BeyondRepo({ onBack }) {
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-10 animate-fade-in">
      <button onClick={onBack} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-6 flex items-center gap-1">
        <ChevronRight size={12} className="rotate-180" /> Back to lessons
      </button>
      <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Topics not in this repo</h2>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        These were asked about, but none of them appear in app-making-book's code. Rather than invent lessons
        unrelated to anything you actually built, here's an honest note on each.
      </p>
      <div className="space-y-3">
        {BEYOND_REPO.map((b) => (
          <div key={b.name} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-input)]">
            <div className="text-sm font-medium text-[var(--text-primary)] mb-1">{b.name}</div>
            <div className="text-xs text-[var(--text-secondary)]">{b.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
