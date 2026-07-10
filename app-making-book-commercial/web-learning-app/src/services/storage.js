// Storage service — the seam between "local only" and "cloud sync".
//
// Guest (not logged in): reads/writes browser localStorage only.
// Logged in: reads/writes backend/src/routes/progressRoutes.ts, with
// localStorage kept as a fast local cache and an offline fallback.
//
// Conflict handling is deliberately simple: last write wins, using
// whichever write reaches the server most recently. That's the same
// strategy most small apps ship with; true conflict resolution
// (merging concurrent edits from two devices) needs versioning this
// project doesn't have yet — noted here rather than left silent.
import { getToken, isLoggedIn, refreshAccessToken } from './authService';

const KEY = 'app-making-book:progress:v1';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function readLocal() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocal(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/**
 * fetch wrapper that retries once after refreshing the access token on
 * a 401. Access tokens now last only 15 minutes (see backend/src/routes/
 * authRoutes.ts) — without this, anyone who keeps a tab open past that
 * would start silently failing to sync until they manually re-login.
 */
async function authedFetch(url, options = {}) {
  const attempt = () =>
    fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${getToken()}` } });

  let res = await attempt();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await attempt();
  }
  return res;
}

export async function getProgress() {
  if (!isLoggedIn()) return readLocal();

  try {
    const res = await authedFetch(`${API_URL}/api/progress`);
    if (!res.ok) throw new Error(`Sync fetch failed (${res.status})`);
    const remote = await res.json();
    // Empty object means "never synced before" — prefer whatever's
    // local in that case instead of wiping it with nothing.
    if (remote && Object.keys(remote).length > 0) {
      writeLocal(remote);
      return remote;
    }
    return readLocal();
  } catch {
    // Offline, or both the access and refresh tokens are invalid —
    // fall back to the local cache instead of losing progress.
    return readLocal();
  }
}

export async function setProgress(data) {
  const localOk = writeLocal(data);

  if (!isLoggedIn()) return localOk;

  try {
    const res = await authedFetch(`${API_URL}/api/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.ok && localOk;
  } catch {
    // No network — local save still succeeded, so don't report failure.
    return localOk;
  }
}

export function exportProgress(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'app-making-book-progress.json';
  a.click();
  URL.revokeObjectURL(url);
}

export function importProgress(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
