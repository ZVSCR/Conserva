import test from 'node:test';
import assert from 'node:assert/strict';
import { apiFetch, advanceSessionRevision, onSessionExpired } from '../../Frontend/src/services/apiClient.js';
import { loginUser, loadSession } from '../../Frontend/src/services/auth.js';

test('todas as operações pessoais enviam cookie e evitam reutilizar dados em cache', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/items/7');
    assert.equal(options.credentials, 'include');
    assert.equal(options.cache, 'no-store');
    assert.equal(options.headers['Content-Type'], 'application/json');
    return { status: 200 };
  });
  for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
    await apiFetch('/api/items/7', { method, credentials: 'omit', cache: 'force-cache', headers: { 'Content-Type': 'application/json' } });
  }
});

test('401 de uma operação pessoal avisa sobre expiração e permite remover a assinatura', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ status: 401 }));
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    await apiFetch('/api/estoque');
    assert.equal(expired, 1);
    unsubscribe();
    await apiFetch('/api/estoque');
    assert.equal(expired, 1);
  } finally { unsubscribe(); }
});

test('senha incorreta e consulta inicial sem sessão não disparam expiração de páginas pessoais', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => ({ status: 401, ok: false, json: async () => ({ error: 'Credenciais inválidas.' }) }));
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    await assert.rejects(loginUser({ identifier: 'ana', password: 'incorreta' }), /Credenciais inválidas/);
    assert.equal(await loadSession(), null);
    assert.equal(expired, 0);
  } finally { unsubscribe(); }
});

test('uma resposta atrasada da conta anterior não encerra uma sessão nova', async (t) => {
  let complete;
  t.mock.method(globalThis, 'fetch', () => new Promise((resolve) => { complete = resolve; }));
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    const previousRequest = apiFetch('/api/estoque');
    advanceSessionRevision();
    complete({ status: 401 });
    await previousRequest;
    assert.equal(expired, 0);
  } finally { unsubscribe(); }
});

test('indisponibilidade do servidor preserva a sessão e deixa o erro para a tela', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => ({ status: 503 }));
  let expired = 0;
  const unsubscribe = onSessionExpired(() => { expired += 1; });
  try {
    assert.equal((await apiFetch('/api/estoque')).status, 503);
    mock.mock.mockImplementation(async () => { throw new TypeError('Network error'); });
    await assert.rejects(apiFetch('/api/estoque'), /Network error/);
    assert.equal(expired, 0);
  } finally { unsubscribe(); }
});
