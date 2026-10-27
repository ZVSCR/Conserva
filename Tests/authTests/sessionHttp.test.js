const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
const app = require('../../Backend/src/app');
const sql = require('../../Backend/src/config/database');
const { SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
let accounts;
let hash;
const publicUser = ({ password_hash, ...user }) => user;

beforeAll(async () => { hash = await bcrypt.hash('senha-correta', 4); });
beforeEach(() => {
    accounts = [7, 42].map((id) => ({ id, username: `conta${id}`, email: `conta${id}@example.test`, tipo: 'domestico', password_hash: hash }));
    sql.mockReset();
    sql.mockImplementation(async (strings, ...values) => {
        const query = strings.join('?');
        if (query.includes('INSERT INTO users')) {
            const user = { id: 99, username: values[0], email: values[1], tipo: values[2], password_hash: values[3] };
            accounts.push(user);
            return [publicUser(user)];
        }
        if (query.includes('LOWER(')) {
            return accounts.filter((user) => user[values[0] ? 'email' : 'username'] === values[1]);
        }
        if (query.includes('FROM users') && query.includes('WHERE id')) {
            return accounts.filter((user) => user.id === values[0]).map(publicUser);
        }
        return [];
    });
});

const login = (client, id = 7, password = 'senha-correta') =>
    client.post('/api/auth/login').send({ identifier: `conta${id}`, password });

test('cadastro, login por email, restauração e saída seguem o contrato JWT da main', async () => {
    const agent = request.agent(app);
    const registered = await agent.post('/api/auth/register').send({
        username: ' ANA ', email: ' ANA@EXAMPLE.TEST ', tipo: ' COMERCIAL ', password: 'senha-nova'
    });
    expect(registered.status).toBe(201);
    expect(registered.headers['set-cookie']).toBeUndefined();
    const logged = await agent.post('/api/auth/login').send({ identifier: 'ana@example.test', password: 'senha-nova' });
    expect(logged.status).toBe(200);
    expect(logged.headers['set-cookie'][0]).toMatch(new RegExp(`${SESSION_COOKIE_NAME}=.*HttpOnly.*SameSite=Lax`));
    const token = logged.headers['set-cookie'][0].split(';')[0].slice(SESSION_COOKIE_NAME.length + 1);
    const payload = jwt.verify(token, process.env.SESSION_SECRET);
    expect(payload.sub).toBe('99');
    expect(payload.exp - payload.iat).toBe(7 * 24 * 60 * 60);
    const restored = await agent.get('/api/auth/me');
    expect(restored.status).toBe(200);
    expect(restored.body.user).toEqual({ id: 99, username: 'ana', email: 'ana@example.test', tipo: 'comercial' });
    expect(restored.body.user).not.toHaveProperty('password_hash');
    const profile = await agent.get('/api/users/me');
    expect(profile.body.data).toEqual(restored.body.user);
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(200);
    expect(logout.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
});

test('sem cookie, consulta da sessão responde 401 sem consultar o banco', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(sql).not.toHaveBeenCalled();
});

test('senha incorreta não envia cookie de sessão', async () => {
    const response = await login(request(app), 7, 'incorreta');
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test.each([7, 42])('consulta da sessão %s ignora a identidade enviada pelo cliente', async (id) => {
    const agent = request.agent(app);
    expect((await login(agent, id)).status).toBe(200);
    const restored = await agent.get('/api/auth/me?usuario_id=999');
    expect(restored.status).toBe(200);
    expect(restored.body.user.id).toBe(id);
    const profile = await agent.get('/api/users/me?usuario_id=999');
    expect(profile.body.data).toMatchObject({ id, username: `conta${id}`, email: `conta${id}@example.test` });
});

test('cookie expirado é rejeitado e removido antes da consulta ao banco', async () => {
    const token = jwt.sign({}, process.env.SESSION_SECRET, { subject: '7', expiresIn: -1 });
    const response = await request(app).get('/api/auth/me').set('Cookie', `${SESSION_COOKIE_NAME}=${token}`);
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    expect(sql).not.toHaveBeenCalled();
});

test('conta removida não é restaurada por /api/auth/me', async () => {
    const agent = request.agent(app);
    await login(agent);
    accounts = [];
    const response = await agent.get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body).not.toHaveProperty('user');
});

test('erro no banco não é apresentado como credencial incorreta', async () => {
    const agent = request.agent(app);
    await login(agent);
    sql.mockRejectedValue(new Error('Falha simulada'));
    const response = await agent.get('/api/auth/me');
    expect(response.status).toBe(500);
    expect(response.body).not.toHaveProperty('user');
});
