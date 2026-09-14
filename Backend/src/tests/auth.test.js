const request = require('supertest');
const app = require('../app');

describe('GET /', () => {
    it('deve retornar status 200 e a mensagem correta', async () => {
        const response = await request(app).get('/');

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message');
    });
});

describe('POST /api/auth/register', () => {

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
});

// jest.mock('../config/database', () => ({
//     query: jest.fn()
// }));

// const db = require('../config/database');

// const bcrypt = require('bcrypt');
// const hash = await bcrypt.hash('senha', 12);

describe('POST /api/auth/login', () => {

    //     // Limpa mocks de DB isolando cada teste
    //     beforeEach(() => {
    //         jest.clearAllMocks();
    //     });

    test('deve retornar 400 quando identifier estiver ausente.', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                password: 'senha'
            });

        expect(response.status).toBe(400);
    });

    //     test('deve retornar 401 quando o usuário não existir.', async () => {

    //         db.query.mockResolvedValue({
    //             rows: []
    //         });

    //         const response = await request(app)
    //             .post('/api/auth/login')
    //             .send({
    //                 identifier: 'aaaaaaaaaa',
    //                 password: 'senha'
    //             });

    //         expect(response.status).toBe(401)
    //     });

    //     test('deve retornar 200 quando efetuar o login.', async () => {

    //         db.query.mockResolvedValue({
    //             rows: [
    //                 {
    //                     id: 1,
    //                     username: 'fulano',
    //                     email: 'email@dofulano.com',
    //                     tipo: 'adm',
    //                     password_hash: hash
    //                 }
    //             ]
    //         });

    //         const response = await request(app)
    //             .post('/api/auth/login')
    //             .send({
    //                 identifier: 'fulano',
    //                 password: 'senha'
    //             });
    //     });

    //     test('deve retornar 500 quando há falha no banco.', async () => {

    //         db.query.mockResolvedValue(
    //             new Error('Erro de banco.')
    //         );

    //         const response = await require(app)
    //             .post('api/auth/login')
    //             .send({
    //                 identifier: 'fulano',
    //                 password: 'senha'
    //             });

    //         expect(response.status).toBe(500);
    //     });
});