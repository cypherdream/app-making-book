import { getToken, refreshAccessToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function billingFetch(path) {
  const attempt = () =>
    fetch(`${API_URL}/api/payments${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
    });

  let res = await attempt();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await attempt();
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const startCheckout = () => billingFetch('/create-checkout-session');
export const openBillingPortal = () => billingFetch('/create-portal-session');
