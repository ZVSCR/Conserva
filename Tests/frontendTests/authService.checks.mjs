import test from 'node:test';
import assert from 'node:assert/strict';
import { registerUser, loginUser, loadSession, logoutUser, AuthRequestError } from '../../Frontend/src/services/auth.js';

const user = { id: 7, username: 'ana', email: 'ana@example.com', tipo: 'domestico' };
const response = (body, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => body });

test('login envia o contrato correto e inclui cookies', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => { calls.push(args); return response({ user }); });
  assert.deepEqual(await loginUser({ identifier: 'ana', password: 'senha' }), user);
  assert.equal(calls[0][0], 'http://localhost:3000/api/auth/login');
  assert.equal(calls[0][1].credentials, 'include');
  assert.equal(calls[0][1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body), { identifier: 'ana', password: 'senha' });
});

test('cadastro preserva tipo e apresenta erros retornados pelo backend', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(JSON.parse(options.body).tipo, 'comercial');
    return response({ errors: [{ message: 'Conta já existe.' }] }, 400);
  });
  await assert.rejects(registerUser({ ...user, tipo: 'comercial', password: 'senha' }), /Conta já existe/);
});

test('sessão ausente é diferente de servidor indisponível', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => response({ error: 'Sem sessão.' }, 401));
  assert.equal(await loadSession(), null);
  mock.mock.mockImplementation(async () => response({ error: 'Falha na sessão.' }, 503));
  await assert.rejects(loadSession(), (error) => error instanceof AuthRequestError && error.status === 503);
});

test('recupera somente dados públicos e permite cancelar a consulta inicial', async (t) => {
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/users/me');
    assert.equal(options.signal, controller.signal);
    return response({ data: { ...user, password_hash: 'não-deve-ser-mantido' } });
  });
  assert.deepEqual(await loadSession({ signal: controller.signal }), user);
});

test('logout aceita resposta sem corpo e envia o cookie', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'http://localhost:3000/api/auth/logout');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'include');
    return { ok: true, status: 204 };
  });
  await logoutUser();
});

test('informa falha de conexão e preserva cancelamentos', async (t) => {
  const mock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Network error'); });
  await assert.rejects(loadSession(), /Não foi possível conectar/);
  mock.mock.mockImplementation(async () => { throw new DOMException('Cancelado', 'AbortError'); });
  await assert.rejects(loadSession(), (error) => error.name === 'AbortError');
});

test('recusa resposta de sucesso sem os dados esperados do usuário', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => response({ user: { id: 7 } }));
  await assert.rejects(loginUser({ identifier: 'ana', password: 'senha' }), /formato inválido/);
});
