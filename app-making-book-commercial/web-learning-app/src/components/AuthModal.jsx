import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { login, register, verifyTwoFactorLogin } from '../services/authService';
import { useFocusTrap } from '../hooks/useFocusTrap';

export default function AuthModal({ onClose, onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | '2fa'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [preAuthToken, setPreAuthToken] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const modalRef = useFocusTrap(true);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === '2fa') {
        const user = await verifyTwoFactorLogin(preAuthToken, code);
        onAuthed(user);
        return;
      }

      let result;
      if (mode === 'register') {
        await register(name, email, password);
        // Registering doesn't log you in automatically on this backend
        // (it returns the created user, not tokens) — log in right
        // after with the same credentials for a one-step experience.
        result = await login(email, password);
      } else {
        result = await login(email, password);
      }

      if (result.twoFactorRequired) {
        setPreAuthToken(result.preAuthToken);
        setMode('2fa');
        setBusy(false);
        return;
      }

      onAuthed(result.user);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const titles = { login: 'Sign in to sync progress', register: 'Create an account', '2fa': 'Enter your 2FA code' };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <form
        ref={modalRef}
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={titles[mode]}
        className="bg-[var(--bg-panel)] border border-[var(--border)] rounded-lg p-5 max-w-xs w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{titles[mode]}</h3>
          <button type="button" onClick={onClose} aria-label="Close"><X size={16} className="text-[var(--text-muted)]" /></button>
        </div>

        {mode === '2fa' ? (
          <>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              Enter the 6-digit code from your authenticator app.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
              required
              className="w-full mb-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60 tracking-widest text-center"
            />
          </>
        ) : (
          <>
            {mode === 'register' && (
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
                required
                className="w-full mb-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
              />
            )}
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              type="email"
              required
              className="w-full mb-2 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 10 characters)"
              type="password"
              minLength={10}
              required
              className="w-full mb-3 bg-[var(--bg-input)] border border-[var(--border)] rounded-md px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[#8B7FD6]/60"
            />
          </>
        )}

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-medium py-2 rounded-md disabled:opacity-50"
        >
          {busy && <Loader2 size={12} className="animate-spin" />}
          {mode === '2fa' ? 'Verify' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>

        {mode !== '2fa' && (
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="w-full text-center text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] mt-3"
          >
            {mode === 'login' ? "No account? Register" : 'Already have an account? Sign in'}
          </button>
        )}

        <p className="text-[10px] text-[var(--text-secondary)] mt-3 leading-relaxed">
          Without an account, progress stays on this device only. This is optional.
        </p>
      </form>
    </div>
  );
}
