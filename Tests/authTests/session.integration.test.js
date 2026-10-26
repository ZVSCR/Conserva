// Integração opcional. TEST_DATABASE_URL deve ser de um Neon exclusivo de testes,
// com o esquema atual e Database/Create/session.sql já aplicados.
const request = require('supertest');
const { Pool } = require('pg');
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('login e sessões persistidas — integração Neon', () => {
    let app;
    let pool;
    let sessionStore;
    let transactionPool;
    let previousDatabaseUrl;
    const userIds = [];
    const tag = `login_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const password = 'SenhaExclusivaDoTeste!';

    beforeAll(() => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();
        // O armazenamento é a implementação real; substitui apenas a fábrica
        // para permitir encerrar seu temporizador ao terminar a suíte.
        const createStore = jest.requireActual('../../Backend/src/config/sessionStore');
        sessionStore = createStore();
        jest.doMock('../../Backend/src/config/sessionStore', () => () => sessionStore);
        app = require('../../Backend/src/app');
        transactionPool = require('../../Backend/src/config/transactionDatabase');
        pool = new Pool({ connectionString: testDatabaseUrl });
    });

    afterAll(async () => {
        try {
            // Remove somente registros criados por esta execução.
            if (pool && userIds.length) {
                await pool.query("DELETE FROM user_sessions WHERE (sess->>'userId')::int = ANY($1::int[])", [userIds]);
                await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
            }
        } finally {
            if (sessionStore) await sessionStore.close();
            if (transactionPool) await transactionPool.end();
            if (pool) await pool.end();
            if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = previousDatabaseUrl;
        }
    });

    test('cadastra duas contas, persiste sessões, separa preferências e invalida saída/expiração', async () => {
        const cookies = [];
        for (const suffix of ['a', 'b']) {
            const username = `${tag}_${suffix}`;
            const registered = await request(app).post('/api/auth/register').send({
                username, email: `${username}@example.test`, tipo: 'domestico', password
            });
            expect(registered.status).toBe(201);
            userIds.push(registered.body.user.id);
            expect(registered.body.user).not.toHaveProperty('password_hash');
            expect(registered.headers['set-cookie']).toBeUndefined();
            const login = await request(app).post('/api/auth/login').send({ identifier: username, password });
            expect(login.status).toBe(200);
            expect(login.body.user).not.toHaveProperty('password_hash');
            cookies.push(login.headers['set-cookie'][0].split(';')[0]);
        }

        const { rows } = await pool.query("SELECT sess FROM user_sessions WHERE (sess->>'userId')::int = ANY($1::int[])", [userIds]);
        expect(rows).toHaveLength(2);
        for (const { sess } of rows) expect(Object.keys(sess).sort()).toEqual(['cookie', 'userId']);
        for (let index = 0; index < 2; index += 1) {
            const profile = await request(app).get('/api/users/me').set('Cookie', cookies[index]);
            expect(profile.status).toBe(200);
            expect(profile.body.data.id).toBe(userIds[index]);
        }

        const changed = await request(app).patch('/api/users/me/preferences').set('Cookie', cookies[0])
            .send({ usuario_id: userIds[1], is_dark_theme: true });
        expect(changed.status).toBe(200);
        expect(changed.body.data.is_dark_theme).toBe(true);
        const other = await request(app).get('/api/users/me/preferences').set('Cookie', cookies[1]);
        expect(other.status).toBe(200);
        expect(other.body.data.is_dark_theme).toBe(false);

        const wrong = await request(app).post('/api/auth/login').send({ identifier: `${tag}_a`, password: 'incorreta' });
        expect(wrong.status).toBe(401);
        expect(wrong.headers['set-cookie']).toBeUndefined();
        expect((await request(app).post('/api/auth/logout').set('Cookie', cookies[0])).status).toBe(204);
        expect((await request(app).get('/api/users/me').set('Cookie', cookies[0])).status).toBe(401);
        await pool.query("UPDATE user_sessions SET expire = NOW() - INTERVAL '1 minute' WHERE (sess->>'userId')::int = $1", [userIds[1]]);
        expect((await request(app).get('/api/users/me').set('Cookie', cookies[1])).status).toBe(401);
    }, 30000);
});
