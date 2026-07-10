import { getToken, refreshAccessToken } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function builderFetch(path, options = {}) {
  const attempt = () =>
    fetch(`${API_URL}/api/builder${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers, Authorization: `Bearer ${getToken()}` },
    });

  let res = await attempt();
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) res = await attempt();
  }
  return res;
}

export async function getCatalog() {
  const res = await builderFetch('/catalog');
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getPreset(name) {
  const res = await builderFetch(`/presets/${name}`);
  if (!res.ok) throw new Error((await res.json()).error);
  return (await res.json()).spec;
}

export async function interpretPrompt(prompt) {
  const res = await builderFetch('/interpret', { method: 'POST', body: JSON.stringify({ prompt }) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body.spec;
}

// Returns a Blob (the zip) — caller triggers the download.
export async function generateProject(spec, mode = 'standalone', includeAndroid = false) {
  const res = await builderFetch('/generate', { method: 'POST', body: JSON.stringify({ spec, mode, includeAndroid }) });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.blob();
}

export async function regenerateEntity(spec, entityName, mode = 'standalone') {
  const res = await builderFetch('/regenerate-entity', { method: 'POST', body: JSON.stringify({ spec, entityName, mode }) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body.files;
}

export async function previewProject(spec, mode = 'standalone', includeAndroid = false) {
  const res = await builderFetch('/preview', { method: 'POST', body: JSON.stringify({ spec, mode, includeAndroid }) });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error);
  return body; // { files, warnings, fileCount }
}

export async function getCommunityTemplates() {
  const res = await builderFetch('/community-templates');
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function shareTemplate(name, description, spec, isPublic) {
  const res = await builderFetch('/community-templates', {
    method: 'POST',
    body: JSON.stringify({ name, description, spec, isPublic }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getCommunityTemplate(id) {
  const res = await builderFetch(`/community-templates/${id}`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
