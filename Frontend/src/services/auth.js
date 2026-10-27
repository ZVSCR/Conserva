import { getApiErrorMessage } from './apiErrors.js';
import { apiFetch } from './api.js';

export class AuthRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AuthRequestError';
    this.status = status;
  }
}

async function authRequest(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await apiFetch(path, {
      method,
      credentials: 'include',
      cache: 'no-store',
      signal,
      ...(body === undefined ? {} : {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    }, { notifyUnauthorized: false });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('Não foi possível conectar ao servidor.');
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    throw new AuthRequestError(getApiErrorMessage(data, 'Não foi possível concluir a operação.'), response.status);
  }
  return data;
}

function publicUser(user) {
  if (!Number.isSafeInteger(user?.id) || user.id <= 0 ||
      !['username', 'email', 'tipo'].every((field) => typeof user[field] === 'string')) {
    throw new Error('O servidor retornou dados de usuário em formato inválido.');
  }
  const { id, username, email, tipo } = user;
  return { id, username, email, tipo };
}

export async function registerUser({ username, email, password, tipo }) {
  const data = await authRequest('/api/auth/register', { method: 'POST', body: { username, email, password, tipo } });
  return publicUser(data?.user);
}

export async function loginUser({ identifier, password }) {
  const data = await authRequest('/api/auth/login', { method: 'POST', body: { identifier, password } });
  return publicUser(data?.user);
}

export async function loadSession({ signal } = {}) {
  try {
    const data = await authRequest('/api/auth/me', { signal });
    return publicUser(data?.user);
  } catch (error) {
    if (error instanceof AuthRequestError && error.status === 401) return null;
    throw error;
  }
}

export async function logoutUser() {
  await authRequest('/api/auth/logout', { method: 'POST' });
}
