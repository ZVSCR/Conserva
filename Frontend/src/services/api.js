export const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL?.trim() || 'http://localhost:3000').replace(/\/+$/, '');

let sessionRevision = 0;

export function advanceSessionRevision() {
  sessionRevision += 1;
}

export async function apiFetch(path, options = {}, { notifyUnauthorized = true } = {}) {
  const revision = sessionRevision;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
  });

  if (response.status === 401 && notifyUnauthorized && revision === sessionRevision) {
    window.dispatchEvent(new Event('conserva:session-expired'));
  }

  return response;
}
