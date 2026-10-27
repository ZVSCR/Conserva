const request = require('supertest');
const bcrypt = require('bcrypt');
jest.mock('../../Backend/src/config/database', () => jest.fn());

const app = require('../../Backend/src/app');
const db = require('../../Backend/src/config/database');
let accounts;
let hashes;

const publicUser = ({ password_hash, ...user }) => user;
const writes = () => db.mock.calls.filter(([strings]) => /INSERT INTO users|UPDATE users/.test(strings.join('?')));

beforeAll(async () => { hashes = await Promise.all(['senha-ana', 'senha-legada'].map((password) => bcrypt.hash(password, 4))); });
beforeEach(async () => {
    accounts = [
        // A conta antiga aparece primeiro para reproduzir a ambiguidade anterior.
        { id: 8, username: 'ana@example.test', email: 'legada@example.test', tipo: 'domestico', password_hash: hashes[1] },
        { id: 7, username: 'ana', email: 'ana@example.test', tipo: 'domestico', password_hash: hashes[0] }
    ];
    db.mockReset();
    db.mockImplementation(async (strings, ...values) => {
        const sql = strings.join('?');
        if (sql.includes('LOWER(')) {
            const [isEmail, identifier] = values;
            return accounts.filter((user) => user[isEmail ? 'email' : 'username'].toLowerCase() === identifier).slice(0, 1);
        }
        if (sql.includes('UPDATE users')) {
            const user = accounts.find((account) => account.id === values.at(-1));
            const [username, email, tipo, passwordHash] = values;
            if (username != null) user.username = username;
            if (email != null) user.email = email;
            if (tipo != null) user.tipo = tipo;
            if (passwordHash != null) user.password_hash = passwordHash;
            return [publicUser(user)];
        }
        if (sql.includes('FROM users') && sql.includes('WHERE id')) {
            return accounts.filter((user) => user.id === values[0]).map(publicUser);
        }
        throw new Error('Consulta não prevista no teste de identificação.');
    });
});

const login = (client, identifier = 'ana', password = 'senha-ana') =>
    client.post('/api/auth/login').send({ identifier, password });

test('email identifica seu proprietário mesmo quando outra conta antiga usa esse email como username', async () => {
    const response = await login(request(app), ' ANA@EXAMPLE.TEST ');
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(7);
    expect(response.body.user).not.toHaveProperty('password_hash');
});

test('a senha da conta antiga não autentica no email pertencente à outra conta', async () => {
    const response = await login(request(app), 'ana@example.test', 'senha-legada');
    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
});

test('conta com username antigo contendo @ pode entrar pelo próprio email', async () => {
    const response = await login(request(app), 'legada@example.test', 'senha-legada');
    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(8);
});

test('cadastro recusa username com @ antes de gravar ou criar sessão', async () => {
    const response = await request(app).post('/api/auth/register').send({
        username: 'ana@example.test', email: 'nova@example.test', tipo: 'domestico', password: 'senha'
    });
    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual(expect.objectContaining({ field: 'username' }));
    expect(db).not.toHaveBeenCalled();
    expect(response.headers['set-cookie']).toBeUndefined();
});

test.each([
    { username: 'outra@example.test' }, { username: null }, { username: 42 }, { username: ' ' },
    { email: 'sem-arroba' }, { email: 'ana@@example.test' }, { email: null }, { email: 42 }
])('perfil recusa identificação inválida sem gravar: %j', async (payload) => {
    const agent = request.agent(app);
    expect((await login(agent)).status).toBe(200);
    const response = await agent.patch('/api/users/me').send(payload);
    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(expect.any(Array));
    expect(writes()).toHaveLength(0);
});

test('perfil normaliza nome/email como o cadastro e permite entrar com os dados novos', async () => {
    const agent = request.agent(app);
    expect((await login(agent)).status).toBe(200);
    const updated = await agent.patch('/api/users/me').send({ username: ' ANA_NOVA ', email: ' NOVA@EXAMPLE.TEST ' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ id: 7, username: 'ana_nova', email: 'nova@example.test' });
    await agent.post('/api/auth/logout');
    expect((await login(agent, ' ANA_NOVA ')).body.user.id).toBe(7);
    expect((await login(agent, ' NOVA@EXAMPLE.TEST ')).body.user.id).toBe(7);
});

test('PATCH de outro campo não exige reenviar nome e email', async () => {
    const agent = request.agent(app);
    expect((await login(agent)).status).toBe(200);
    const updated = await agent.patch('/api/users/me').send({ tipo: 'comercial' });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ id: 7, username: 'ana', email: 'ana@example.test', tipo: 'comercial' });
});
