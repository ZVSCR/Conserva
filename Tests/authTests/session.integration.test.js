// TEST_DATABASE_URL deve apontar para um Neon exclusivo de testes com o esquema atual.
const request = require('supertest');
const { Pool } = require('pg');
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('login JWT e separação de contas — integração Neon', () => {
    let app;
    let pool;
    let transactionPool;
    let previousDatabaseUrl;
    const userIds = [];
    const tag = `login_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const password = 'SenhaExclusivaDoTeste!';

    beforeAll(() => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();
        app = require('../../Backend/src/app');
        transactionPool = require('../../Backend/src/config/transactionDatabase');
        pool = new Pool({ connectionString: testDatabaseUrl });
    });

    afterAll(async () => {
        try {
            if (pool && userIds.length) await pool.query('DELETE FROM users WHERE id = ANY($1::int[])', [userIds]);
        } finally {
            if (transactionPool) await transactionPool.end();
            if (pool) await pool.end();
            if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = previousDatabaseUrl;
        }
    });

    test('cadastra duas contas, restaura o usuário do JWT e separa suas preferências', async () => {
        const cookies = [];
        for (const suffix of ['a', 'b']) {
            const username = `${tag}_${suffix}`;
            const registered = await request(app).post('/api/auth/register').send({
                username, email: `${username}@example.test`, tipo: 'domestico', password
            });
            expect(registered.status).toBe(201);
            userIds.push(registered.body.user.id);
            expect(registered.body.user).not.toHaveProperty('password_hash');
            const logged = await request(app).post('/api/auth/login').send({ identifier: username, password });
            expect(logged.status).toBe(200);
            cookies.push(logged.headers['set-cookie'][0].split(';')[0]);
        }
        for (let index = 0; index < 2; index += 1) {
            const restored = await request(app).get('/api/auth/me').set('Cookie', cookies[index]);
            expect(restored.status).toBe(200);
            expect(restored.body.user.id).toBe(userIds[index]);
            expect(restored.body.user).not.toHaveProperty('password_hash');
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
    }, 30000);
});
