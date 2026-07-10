import { useState } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import { startCheckout, openBillingPortal } from '../services/billingApi';
import { useFocusTrap } from '../hooks/useFocusTrap';

/**
 * Real Stripe integration on the frontend side: "Upgrade" creates a
 * real Checkout session and redirects there; "Manage billing" opens
 * Stripe's real Customer Portal. Both routes return a 503 if Stripe
 * isn't configured on the backend yet (see backend/src/routes/
 * paymentRoutes.ts) — this component surfaces that honestly instead
 * of pretending the button does something it can't.
 */
export default function BillingModal({ isPremium, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const modalRef = useFocusTrap(true);

  const handleUpgrade = async () => {
    setBusy(true);
    setError('');
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const handleManage = async () => {
    setBusy(true);
    setError('');
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-label="Billing"
        className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-5 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <CreditCard size={16} /> Billing
          </h3>
          <button onClick={onClose} aria-label="Close"><X size={16} className="text-[var(--text-muted)]" /></button>
        </div>

        <div className="mb-4 p-3 rounded-md bg-[var(--bg-input)] border border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)]">Current plan</div>
          <div className="text-sm font-medium text-[var(--text-primary)]">{isPremium ? 'Premium' : 'Free'}</div>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button
          onClick={isPremium ? handleManage : handleUpgrade}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-medium py-2 rounded-md disabled:opacity-50"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          {isPremium ? 'Manage billing' : 'Upgrade to Premium'}
        </button>

        <p className="text-[10px] text-[var(--text-secondary)] mt-3 leading-relaxed">
          {isPremium
            ? 'Opens the Stripe customer portal — cancel, update your card, or view invoices there.'
            : 'Redirects to Stripe Checkout. Requires the backend to have Stripe configured (STRIPE_SECRET_KEY, STRIPE_PRICE_ID) — see backend/.env.example.'}
        </p>
      </div>
    </div>
  );
}
