import { ChevronRight } from 'lucide-react';

export default function DiagramFlow({ steps, accent }) {
  return (
    <div className="flex flex-wrap items-center gap-2 my-4 p-4 rounded-lg bg-[var(--bg-input)] border border-[var(--border)]">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="px-3 py-2 rounded-md text-xs font-mono font-medium"
            style={{ background: `${accent}22`, color: accent, border: `1px solid ${accent}55` }}
          >
            {s}
          </div>
          {i < steps.length - 1 && <ChevronRight size={16} className="text-[var(--text-muted)] flex-shrink-0" />}
        </div>
      ))}
    </div>
  );
}
