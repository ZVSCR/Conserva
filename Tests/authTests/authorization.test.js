const request = require('supertest');

jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const sql = require('../../Backend/src/config/database');
const { createSessionToken, SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
const app = require('../../Backend/src/app');
const { loginRepo } = require('../../Backend/src/repositories/authRepository');

const cookie = (id) => `${SESSION_COOKIE_NAME}=${createSessionToken(id)}`;

beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    sql.mockReset();
    sql.mockResolvedValue([]);
});

test.each(['/api/compras', '/api/estoque', '/api/items', '/api/receitas', '/api/ingredientes/7'])
('não permite acessar %s sem sessão', async (path) => {
    const response = await request(app).get(path);
    expect(response.status).toBe(401);
    expect(sql).not.toHaveBeenCalled();
});

test.each(['/api/compras', '/api/estoque', '/api/items', '/api/receitas'])
('%s usa o usuário do cookie mesmo com usuario_id de outra conta', async (path) => {
    const response = await request(app).get(path)
        .set('Cookie', cookie(42)).query({ usuario_id: 1 });

    expect(response.status).toBe(200);
    expect(sql.mock.calls.some(([, ...values]) => values.includes(42))).toBe(true);
    expect(sql.mock.calls.every(([, ...values]) => !values.includes(1))).toBe(true);
});

test('não devolve receita pertencente a outra conta', async () => {
    const response = await request(app).get('/api/receitas/7').set('Cookie', cookie(42));
    expect(response.status).toBe(404);
    const [segments, id, userId] = sql.mock.calls[0];
    expect(segments.join('?')).toContain('r.usuario_id IS NULL OR r.usuario_id = ?');
    expect([id, userId]).toEqual([7, 42]);
});

test('histórico de preparos consulta apenas o usuário da sessão', async () => {
    const response = await request(app).get('/api/receitas/preparadas')
        .set('Cookie', cookie(42)).query({ usuario_id: 1 });
    expect(response.status).toBe(200);
    expect(response.body.refeicoesPreparadas).toEqual([]);
    const [segments, userId] = sql.mock.calls[0];
    expect(segments.join('?')).toContain('WHERE rp.usuario_id = ?');
    expect(userId).toBe(42);
});

test('busca item apenas dentro das compras do usuário autenticado', async () => {
    const response = await request(app).get('/api/items/7').set('Cookie', cookie(42));
    expect(response.status).toBe(404);
    const [segments, itemId, userId] = sql.mock.calls[0];
    expect(segments.join('?')).toContain('c.usuario_id = ?');
    expect([itemId, userId]).toEqual(['7', 42]);
});

test('apenas o administrador pode alterar ingredientes e consultar gastos gerais', async () => {
    const ingredient = await request(app).patch('/api/ingredientes/7')
        .set('Cookie', cookie(42)).send({ nome: 'Coco ralado' });
    const expenses = await request(app).get('/api/users/gastos').set('Cookie', cookie(42));

    expect(ingredient.status).toBe(403);
    expect(expenses.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
});

test('rejeita alteração com Origin externo mesmo com cookie válido', async () => {
    const response = await request(app).post('/api/compras')
        .set('Origin', 'https://origem-externa.example')
        .set('Cookie', cookie(42)).send({});
    expect(response.status).toBe(403);
    expect(sql).not.toHaveBeenCalled();
});

test('não permite criar um username que se confunda com email', async () => {
    const response = await request(app).post('/api/auth/register').send({
        username: 'outra-pessoa@example.com', email: 'novo@example.com',
        tipo: 'domestico', password: 'senha-de-teste'
    });
    expect(response.status).toBe(400);
    expect(sql).not.toHaveBeenCalled();
});

test('login por email consulta apenas email; por username consulta apenas username', async () => {
    await loginRepo({ identifier: 'pessoa@example.com' });
    await loginRepo({ identifier: 'pessoa' });
    expect(sql.mock.calls[0].slice(1)).toEqual([true, 'pessoa@example.com']);
    expect(sql.mock.calls[1].slice(1)).toEqual([false, 'pessoa']);
});
