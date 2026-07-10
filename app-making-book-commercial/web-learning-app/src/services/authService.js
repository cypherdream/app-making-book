// Talks to backend/src/routes/authRoutes.ts. Tokens are kept in
// localStorage (not httpOnly cookies) — acceptable for this project,
// but a cookie-based session is more XSS-resistant for a real
// commercial deploy; that requires the backend to set cookies itself,
// which it doesn't do yet.
//
// This file previously expected the backend to return { token, user }
// — a shape that stopped being true once the backend was reworked to
// issue short-lived access tokens + long-lived refresh tokens (and to
// support a 2FA challenge step). That mismatch meant login was
// silently broken on the frontend. Fixed here to match the real
// current response shapes.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const ACCESS_TOKEN_KEY = 'app-making-book:accessToken';
const REFRESH_TOKEN_KEY = 'app-making-book:refreshToken';
const USER_KEY = 'app-making-book:user';

export function getToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setTokens({ accessToken, refreshToken }) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user) {
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function logout() {
  // Best-effort server-side revocation; still clear local tokens even
  // if the network call fails, since the whole point of logging out
  // locally is to work regardless of connectivity.
  const token = getToken();
  if (token) {
    fetch(`${API_URL}/api/auth/logout-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
  }
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function parseJsonOrThrow(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
  return body;
}

export async function register(name, email, password) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  return parseJsonOrThrow(res);
}

/**
 * Returns either { user } on a completed login, or
 * { twoFactorRequired: true, preAuthToken } if the account has 2FA
 * enabled — the caller (AuthModal) needs to branch on this.
 */
export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await parseJsonOrThrow(res);

  if (data.twoFactorRequired) {
    return { twoFactorRequired: true, preAuthToken: data.preAuthToken };
  }

  setTokens(data);
  setStoredUser(data.user);
  return { user: data.user };
}

export async function verifyTwoFactorLogin(preAuthToken, code) {
  const res = await fetch(`${API_URL}/api/auth/2fa/verify-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ preAuthToken, code }),
  });
  const data = await parseJsonOrThrow(res);
  setTokens(data);
  setStoredUser(data.user);
  return data.user;
}

/**
 * Exchanges the refresh token for a new access token. Called by
 * services/storage.js when a request comes back 401, instead of
 * immediately forcing a re-login — access tokens only last 15
 * minutes, so this needs to happen fairly often during normal use.
 */
export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await parseJsonOrThrow(res);
    setTokens({ accessToken: data.accessToken });
    return true;
  } catch {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return false;
  }
}

export function isLoggedIn() {
  return !!getToken();
}
