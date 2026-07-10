// Self-hosted analytics client — sends events to
// backend/src/routes/analyticsRoutes.ts instead of a third-party SaaS.
// Fire-and-forget: analytics must never block or break the UI, so
// every call swallows its own errors.
import { getToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function trackEvent(type, lessonId, metadata) {
  const token = getToken();
  fetch(`${API_URL}/api/analytics/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ type, lessonId, metadata }),
  }).catch(() => {
    // Analytics failing silently is correct behavior — never surface
    // this to the user or retry aggressively.
  });
}

// Catches errors anywhere in the React tree (via ErrorBoundary) and
// reports them as 'client_error' events, giving basic crash visibility
// without a third-party crash-reporting SDK.
export function trackClientError(message, stack) {
  trackEvent('client_error', undefined, { message, stack: stack?.slice(0, 2000) });
}
