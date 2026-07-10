// Thin client for backend/src/routes/adminRoutes.ts. All calls require
// an admin JWT — the backend re-checks isAdmin on every request
// regardless of what this client sends, so there's no client-side
// trust boundary being relied on here.
import { getToken, refreshAccessToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function adminFetch(path, options = {}) {
  const attempt = () =>
    fetch(`${API_URL}/api/admin${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${getToken()}` },
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
  return res.status === 204 ? null : res.json();
}

export const getDashboard = () => adminFetch('/dashboard');
export const getUsers = () => adminFetch('/users');
export const banUser = (id) => adminFetch(`/users/${id}/ban`, { method: 'POST' });
export const unbanUser = (id) => adminFetch(`/users/${id}/unban`, { method: 'POST' });
export const getAuditLog = () => adminFetch('/audit-log');
export const getRateLimitHits = () => adminFetch('/rate-limit-hits');
