import { API_BASE_URL } from './apiConfig.js';

const expiredListeners = new Set();
let sessionRevision = 0;

export function advanceSessionRevision() {
  sessionRevision += 1;
}

export function onSessionExpired(listener) {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

export async function apiFetch(path, options = {}, { notifyUnauthorized = true } = {}) {
  const revision = sessionRevision;
  const url = path.startsWith('/') ? `${API_BASE_URL}${path}` : path;
  const response = await fetch(url, { ...options, credentials: 'include', cache: 'no-store' });
  if (response.status === 401 && notifyUnauthorized && revision === sessionRevision) {
    expiredListeners.forEach((listener) => listener());
  }
  return response;
}
