import { highlight } from '../utils/highlight.jsx';

export default function CodeBlock({ code, filename }) {
  return (
    <div className="rounded-lg overflow-hidden border border-[var(--border)] my-4">
      <div className="bg-black/40 px-3 py-1.5 text-xs font-mono text-[var(--text-muted)] border-b border-[var(--border)]">
        {filename}
      </div>
      <pre className="bg-[#11141c] text-[13px] leading-relaxed p-4 overflow-x-auto font-mono text-[var(--text-primary)]">
        <code>{highlight(code)}</code>
      </pre>
    </div>
  );
}
