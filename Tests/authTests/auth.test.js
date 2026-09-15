const request = require('supertest');
const app = require('../../Backend/src/app');

jest.mock('../../Backend/src/config/database.js', () => ({
    query: jest.fn()
}));

const db = require('../../Backend/src/config/database');

const bcrypt = require('bcrypt');

// Teste de servidor
describe('GET /', () => {
    it('deve retornar status 200 e a mensagem correta', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
    });
});

// Teste de registro
describe('POST /api/auth/register', () => {

    // Limpa mocks de DB
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TESTES DE VALIDAÇÃO
    test('deve retornar 400 se não enviou username.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se não enviou email.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se não enviou tipo.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                email: 'email@dofulano.com',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se não enviou senha.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                email: 'email@dofulano.com',
                tipo: 'adm',
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se username está em branco.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: '   ',
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se email está em branco.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'odkekod',
                email: '   ',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se tipo está em branco.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'efefwe',
                email: 'email@dofulano.com',
                tipo: '   ',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se username não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 123,
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se email não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'ijfeijfie',
                email: 949389389,
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se tipo não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'okwdoekokdeo',
                email: 'email@dofulano.com',
                tipo: 43943895845948,
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se senha não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'okwdoekokdeo',
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 432423
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se username ultrapassa limite.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'a'.repeat(150),
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se email ultrapassa limite.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'odoekokekfoe',
                email: 'a'.repeat(150),
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se tipo ultrapassa limite.', async () => {

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'oefjijejfo',
                email: 'email@dofulano.com',
                tipo: 'a'.repeat(150),
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    // TESTE DE INFRAESTRUTURA
    test('deve retornar 500 quando ocorrer erro no banco.', async () => {

        db.query.mockRejectedValue(
            new Error('Erro de banco')
        );

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                email: 'email@dofulano.com',
                tipo: 'amd',
                password: 'senha'
            });

        expect(response.status).toBe(500);
    });

    test('deve retornar 409 se dados já existem.', async () => {

        const error = new Error('Unique violation');
        error.code = '23505'

        db.query.mockRejectedValue(error);

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(409);
    });

    // TESTE DE REGISTRO DE USUÁRIO
    test('deve retornar 201 se usuário foi registrado.', async () => {

        db.query.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    username: 'fulano',
                    email: 'email@dofulano.com',
                    tipo: 'adm',
                    created_at: new Date()
                }
            ]
        });

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'fulano',
                email: 'email@dofulano.com',
                tipo: 'adm',
                password: 'senha'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.username).toBe('fulano');
        // Segurança de resposta
        expect(response.body.user).not.toHaveProperty('password_hash');
    });
});

describe('POST /api/auth/login', () => {

    // Hashing de senha de acordo com o controller
    let hash;
    beforeAll(async () => {
        hash = await bcrypt.hash('senha', 12);
    });

    // Limpa mocks de DB
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // TESTES DE VALIDAÇÃO
    test('deve retornar 400 quando identifier estiver ausente.', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 quando password estiver ausente.', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'fulano'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se identifier não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 123,
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se password não é string.', async () => {

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'fulano',
                password: 439364868
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se identifier é vazio.', async () => {

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: '    ',
                password: 'iefoeo'
            });

        expect(response.status).toBe(400);
    });

    test('deve retornar 400 se identifier é >100.', async () => {

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'a'.repeat(150),
                password: 'iefoeo'
            });

        expect(response.status).toBe(400);
    });

    // TESTES DE AUTENTICAÇÃO
    test('deve retornar 401 quando o usuário não existir.', async () => {

        db.query.mockResolvedValue({
            rows: []
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'aaaaaaaaaa',
                password: 'senha'
            });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Identificador ou senha inválidos.');
    });

    test('deve retornar 401 quando a senha está incorreta.', async () => {

        const hash = await bcrypt.hash('senha', 12);

        db.query.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    username: 'fulano',
                    email: 'email@dofulano.com',
                    tipo: 'adm',
                    password_hash: hash
                }
            ]
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'aaaaaaaaaa',
                password: 'senhaRuim'
            });

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Identificador ou senha inválidos.');
    });

    test('deve retornar 200 quando efetuar o login por username.', async () => {

        db.query.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    username: 'fulano',
                    email: 'email@dofulano.com',
                    tipo: 'adm',
                    password_hash: hash
                }
            ]
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'fulano',
                password: 'senha'
            });

        expect(response.status).toBe(200);
        expect(response.body.user).toEqual({
            id: 1,
            username: 'fulano',
            email: 'email@dofulano.com',
            tipo: 'adm'
        });
        // Segurança de resposta
        expect(response.body.user).not.toHaveProperty('password_hash');
    });

    test('deve retornar 200 quando efetuar o login por email.', async () => {

        db.query.mockResolvedValue({
            rows: [
                {
                    id: 1,
                    username: 'fulano',
                    email: 'email@dofulano.com',
                    tipo: 'adm',
                    password_hash: hash
                }
            ]
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'email@dofulano.com',
                password: 'senha'
            });

        expect(response.status).toBe(200);
        expect(response.body.user).toEqual({
            id: 1,
            username: 'fulano',
            email: 'email@dofulano.com',
            tipo: 'adm'
        });
        // Segurança de resposta
        expect(response.body.user).not.toHaveProperty('password_hash');
    });

    // TESTES DE INFRAESTRUTURA
    test('deve retornar 500 quando há falha no banco.', async () => {

        db.query.mockRejectedValue(
            new Error('Erro de banco.')
        );

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'fulano',
                password: 'senha'
            });

        expect(response.status).toBe(500);
    });
});