import { useState } from 'react';
import { X, ArrowRight, Keyboard, Cloud, Trophy } from 'lucide-react';

const STEPS = [
  {
    icon: Keyboard,
    title: 'Learn at your own pace',
    body: "Search, filter by track, and use keyboard shortcuts (press ? anytime to see them) to move around quickly.",
  },
  {
    icon: Cloud,
    title: 'Your progress is saved',
    body: 'Automatically, on this device. Sign in any time to sync it across devices too — totally optional.',
  },
  {
    icon: Trophy,
    title: 'Earn a certificate',
    body: 'Complete all the lessons to unlock a downloadable certificate and badges along the way.',
  },
];

/**
 * Shown once, on first visit — controlled by a flag in
 * usePersistentProgress's saved state so it doesn't reappear.
 */
export default function OnboardingTour({ onDismiss }) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div role="dialog" aria-modal="true" aria-label="Welcome" className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-6 max-w-sm w-full">
        <div className="flex justify-end mb-2">
          <button onClick={onDismiss} aria-label="Skip"><X size={16} className="text-[var(--text-muted)]" /></button>
        </div>
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-[#8B7FD6]/15">
            <Icon size={24} className="text-[#8B7FD6]" />
          </div>
        </div>
        <h3 className="text-center text-base font-semibold text-[var(--text-primary)] mb-2">{current.title}</h3>
        <p className="text-center text-sm text-[var(--text-secondary)] mb-6">{current.body}</p>

        <div className="flex items-center justify-center gap-1.5 mb-4">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[#8B7FD6]' : 'w-1.5 bg-[var(--border)]'}`} />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onDismiss() : setStep((s) => s + 1))}
          className="w-full flex items-center justify-center gap-2 bg-[#8B7FD6] text-black text-xs font-medium py-2 rounded-md"
        >
          {isLast ? "Let's go" : 'Next'} <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
