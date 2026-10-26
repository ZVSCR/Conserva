const request = require('supertest');
const bcrypt = require('bcrypt');
jest.mock('../../Backend/src/config/database', () => jest.fn());

const app = require('../../Backend/src/app');
const db = require('../../Backend/src/config/database');
const createSessionStore = require('../../Backend/src/config/sessionStore');
const store = createSessionStore.mock.results[0].value;
const user = { id: 7, username: 'ana', email: 'ana@example.com', tipo: 'domestico' };
let passwordHash;

beforeAll(async () => { passwordHash = await bcrypt.hash('senha-correta', 4); });
beforeEach(async () => {
    jest.restoreAllMocks();
    db.mockReset();
    db.mockResolvedValue([{ ...user, password_hash: passwordHash }]);
    await new Promise((resolve) => store.clear(resolve));
});

async function login(client = request(app)) {
    return client.post('/api/auth/login').send({ identifier: 'ana', password: 'senha-correta' });
}

test('sem sessão, /me responde 401 sem consultar o banco', async () => {
    const response = await request(app).get('/api/users/me');
    expect(response.status).toBe(401);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(db).not.toHaveBeenCalled();
});

test('login cria cookie protegido e guarda somente userId e cookie na sessão', async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(response.headers['set-cookie'][0]).toMatch(/conservia\.sid=.*HttpOnly.*SameSite=Lax/);
    expect(response.body.user).not.toHaveProperty('password_hash');
    const sessions = Object.values(store.sessions).map(JSON.parse);
    expect(sessions).toHaveLength(1);
    expect(Object.keys(sessions[0]).sort()).toEqual(['cookie', 'userId']);
    expect(sessions[0].userId).toBe(user.id);
});

test('cadastro, login por email, recuperação da sessão e saída funcionam em sequência', async () => {
    let savedUser;
    db.mockImplementation(async (strings, ...values) => {
        const sql = strings.join('?');
        if (sql.includes('INSERT INTO users')) {
            savedUser = { id: 9, username: values[0], email: values[1], tipo: values[2], password_hash: values[3] };
            const { password_hash, ...publicUser } = savedUser;
            return [publicUser];
        }
        const { password_hash, ...publicUser } = savedUser;
        return sql.includes('LOWER(username)') || sql.includes('LOWER(email)') ? [savedUser] : [publicUser];
    });
    const agent = request.agent(app);
    const registered = await agent.post('/api/auth/register').send({
        username: ' ANA ', email: ' ANA@EXAMPLE.COM ', tipo: ' COMERCIAL ', password: 'senha-correta'
    });
    expect(registered.status).toBe(201);
    expect(registered.headers['set-cookie']).toBeUndefined();
    const logged = await agent.post('/api/auth/login').send({ identifier: 'ana@example.com', password: 'senha-correta' });
    expect(logged.status).toBe(200);
    const oldCookie = logged.headers['set-cookie'][0].split(';')[0];
    expect((await agent.get('/api/users/me')).body.data).toEqual({
        id: 9, username: 'ana', email: 'ana@example.com', tipo: 'comercial'
    });
    expect((await request(app).get('/api/users/me').set('Cookie', oldCookie)).status).toBe(200);
    const logout = await agent.post('/api/auth/logout');
    expect(logout.status).toBe(204);
    expect(logout.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
    expect((await request(app).get('/api/users/me').set('Cookie', oldCookie)).status).toBe(401);
    expect((await agent.get('/api/users/me')).status).toBe(401);
    expect((await agent.post('/api/auth/logout')).status).toBe(204);
});

test('senha incorreta não cria sessão autenticada', async () => {
    const response = await request(app).post('/api/auth/login').send({ identifier: 'ana', password: 'errada' });
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
    expect(Object.keys(store.sessions)).toHaveLength(0);
});

test('novo login troca a identificação da sessão e invalida o cookie anterior', async () => {
    const agent = request.agent(app);
    const first = await login(agent);
    const previousCookie = first.headers['set-cookie'][0].split(';')[0];
    const second = await login(agent);
    expect(second.status).toBe(200);
    expect(second.headers['set-cookie'][0].split(';')[0]).not.toBe(previousCookie);
    expect((await request(app).get('/api/users/me').set('Cookie', previousCookie)).status).toBe(401);
});

test('sessão expirada não permite consultar o perfil', async () => {
    const logged = await login();
    const [sid] = Object.keys(store.sessions);
    const expired = JSON.parse(store.sessions[sid]);
    expired.cookie.expires = new Date(0).toISOString();
    store.sessions[sid] = JSON.stringify(expired);
    const response = await request(app).get('/api/users/me').set('Cookie', logged.headers['set-cookie']);
    expect(response.status).toBe(401);
});

test('usuário removido invalida a sessão', async () => {
    const agent = request.agent(app);
    await login(agent);
    db.mockResolvedValue([]);
    expect((await agent.get('/api/users/me')).status).toBe(401);
    expect(Object.keys(store.sessions)).toHaveLength(0);
});

test('falha ao persistir sessão impede sucesso no login', async () => {
    jest.spyOn(store, 'set').mockImplementation((sid, value, callback) => callback(new Error('Falha simulada')));
    const response = await login();
    expect(response.status).toBe(500);
    expect(Object.keys(store.sessions)).toHaveLength(0);
    expect(response.headers['set-cookie'][0]).toContain('Expires=Thu, 01 Jan 1970');
});

test('falha ao ler a sessão retorna erro de serviço, sem perfil', async () => {
    const logged = await login();
    jest.spyOn(store, 'get').mockImplementation((sid, callback) => callback(new Error('Falha simulada')));
    const response = await request(app).get('/api/users/me').set('Cookie', logged.headers['set-cookie']);
    expect(response.status).toBe(503);
    expect(response.body).not.toHaveProperty('data');
});

test('login de uma origem diferente é recusado antes da consulta ao banco', async () => {
    const response = await request(app).post('/api/auth/login').set('Origin', 'https://outro.example')
        .send({ identifier: 'ana', password: 'senha-correta' });
    expect(response.status).toBe(403);
    expect(db).not.toHaveBeenCalled();
});

test('autoriza cookies apenas para a origem configurada do frontend', async () => {
    const response = await request(app).options('/api/auth/login')
        .set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST');
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(response.headers['access-control-allow-credentials']).toBe('true');
});

test('contas antigas continuam entrando com o tipo que já está no banco', async () => {
    db.mockResolvedValue([{ ...user, tipo: 'adm', password_hash: passwordHash }]);
    expect((await login()).body.user.tipo).toBe('adm');
});
