const session = require('express-session');
const { getSessionConfig } = require('../../Backend/src/config/session');
const env = { SESSION_SECRET: 'chave-aleatoria-de-teste-com-32-bytes-ou-mais' };

test('exige configuração explícita da chave e validade positiva', () => {
    expect(() => getSessionConfig({})).toThrow('SESSION_SECRET');
    expect(() => getSessionConfig({ SESSION_SECRET: 'curta' })).toThrow('SESSION_SECRET');
    expect(() => getSessionConfig({ ...env, SESSION_MAX_AGE_MS: '-1' })).toThrow('SESSION_MAX_AGE_MS');
});

test('cookie local tem validade fixa e cookie de produção exige HTTPS', () => {
    expect(getSessionConfig(env).cookie).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false, maxAge: 86400000 });
    expect(getSessionConfig({ ...env, NODE_ENV: 'production' }).cookie.secure).toBe(true);
});

test.each(['*', 'http://localhost:5173/', 'https://example.com/pagina'])('recusa origem inválida %s', (origin) => {
    expect(() => getSessionConfig({ ...env, FRONTEND_ORIGIN: origin })).toThrow();
});

test('armazenamento real utiliza a tabela do Neon e não renova o prazo ao consultar', async () => {
    const pool = require('../../Backend/src/config/transactionDatabase');
    const query = jest.spyOn(pool, 'query').mockResolvedValue({ rows: [] });
    const createStore = jest.requireActual('../../Backend/src/config/sessionStore');
    const store = createStore();
    expect(store).toBeInstanceOf(session.Store);
    expect(store).not.toBeInstanceOf(session.MemoryStore);
    await new Promise((resolve, reject) => store.set('sessao-teste', {
        userId: 7, cookie: { expires: new Date(Date.now() + 60000) }
    }, (error) => error ? reject(error) : resolve()));
    expect(query.mock.calls[0][0]).toContain('"user_sessions"');
    const count = query.mock.calls.length;
    await new Promise((resolve) => store.touch('sessao-teste', { cookie: {} }, resolve));
    expect(query).toHaveBeenCalledTimes(count);
    await store.close();
    query.mockRestore();
});
