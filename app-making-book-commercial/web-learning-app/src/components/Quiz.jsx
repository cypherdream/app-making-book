import { useState } from 'react';

export default function Quiz({ question, options, correct }) {
  const [picked, setPicked] = useState(null);
  return (
    <div className="rounded-lg border border-[var(--border)] p-4 my-4 bg-[var(--bg-input)]">
      <p className="text-sm font-medium text-[var(--text-primary)] mb-3">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isCorrect = i === correct;
          let style = 'border-[var(--border)] text-[var(--text-secondary)] hover:border-white/30';
          if (picked !== null && isPicked && isCorrect) style = 'border-green-400/60 bg-green-400/10 text-green-300';
          if (picked !== null && isPicked && !isCorrect) style = 'border-red-400/60 bg-red-400/10 text-red-300';
          if (picked !== null && !isPicked && isCorrect) style = 'border-green-400/40 text-green-300/80';
          return (
            <button
              key={i}
              onClick={() => setPicked(i)}
              className={`w-full text-left text-sm px-3 py-2 rounded-md border transition ${style}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <p className="text-xs mt-3 text-[var(--text-muted)]">
          {picked === correct ? 'Correct.' : 'Not quite — the highlighted option above is right.'}
        </p>
      )}
    </div>
  );
}
