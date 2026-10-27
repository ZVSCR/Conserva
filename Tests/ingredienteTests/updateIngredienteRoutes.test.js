const request = require('supertest');
jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(1));

// Exercita rota, controlador, serviço e repositório sem acessar o banco real.
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const sql = require('../../Backend/src/config/database');
const app = require('../../Backend/src/app');

beforeEach(() => jest.resetAllMocks());

describe('PATCH /api/ingredientes/:id', () => {
    test.each([
        ['  Coco   Ralado!  ', 'coco ralado'],
        ['OVOS', 'ovo'],
        ['Açúcar', 'acucar']
    ])('atualiza o nome %s seguindo a normalização do cadastro', async (nome, normalizado) => {
        const ingrediente = { id: 7, nome: normalizado };
        sql.mockResolvedValue([ingrediente]);

        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1').send({ nome });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
            message: 'Ingrediente atualizado com sucesso.',
            ingrediente
        });
        expect(sql).toHaveBeenCalledTimes(1);
        const [consulta, ...parametros] = sql.mock.calls[0];
        expect(consulta.join('?')).toMatch(/UPDATE ingrediente\s+SET nome = \?\s+WHERE id = \?\s+RETURNING id, nome/i);
        expect(parametros).toEqual([normalizado, 7]);
    });

    test.each(['0', '-1', 'abc', '1.5', '01', '1e2', '2147483648', '9007199254740992'])(
        'rejeita id inválido ou fora do limite SERIAL: %s', async (id) => {
            const response = await request(app).patch(`/api/ingredientes/${id}?usuario_id=1`)
                .send({ nome: 'Coco ralado' });

            expect(response.status).toBe(400);
            expect(response.body).toEqual({ error: 'id deve ser um inteiro positivo.' });
            expect(sql).not.toHaveBeenCalled();
        }
    );

    test.each([
        {}, { nome: null }, { nome: 42 }, { nome: false }, { nome: [] },
        { nome: '' }, { nome: '   ' }, { nome: '!!!' }, { nome: 'x'.repeat(101) }
    ])('rejeita nome inválido sem consultar o banco: %p', async (body) => {
        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1').send(body);

        expect(response.status).toBe(400);
        expect(response.body.errors).toEqual(expect.arrayContaining([
            expect.objectContaining({ field: 'nome' })
        ]));
        expect(sql).not.toHaveBeenCalled();
    });

    test.each([[], 'texto', null])('rejeita corpo não objeto: %p', async (body) => {
        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1')
            .set('Content-Type', 'application/json').send(JSON.stringify(body));

        expect(response.status).toBe(400);
        expect(sql).not.toHaveBeenCalled();
    });

    test('rejeita corpo ausente', async () => {
        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1');
        expect(response.status).toBe(400);
        expect(sql).not.toHaveBeenCalled();
    });

    test('aceita nome no limite de 100 caracteres e o maior id SERIAL', async () => {
        const ingrediente = { id: 2147483647, nome: 'x'.repeat(100) };
        sql.mockResolvedValue([ingrediente]);

        const response = await request(app).patch('/api/ingredientes/2147483647?usuario_id=1')
            .send({ nome: ingrediente.nome });

        expect(response.status).toBe(200);
        expect(sql.mock.calls[0].slice(1)).toEqual([ingrediente.nome, ingrediente.id]);
    });

    test('mantém o ID e aceita salvar o mesmo nome', async () => {
        sql.mockResolvedValue([{ id: 7, nome: 'ovo' }]);

        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1')
            .send({ nome: 'ovo' });

        expect(response.status).toBe(200);
        expect(response.body.ingrediente).toEqual({ id: 7, nome: 'ovo' });
    });

    test('retorna 404 quando o ingrediente não existe', async () => {
        sql.mockResolvedValue([]);

        const response = await request(app).patch('/api/ingredientes/999?usuario_id=1')
            .send({ nome: 'Coco ralado' });

        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Ingrediente não encontrado.' });
    });

    test('retorna 409 quando o nome normalizado já pertence a outro ingrediente', async () => {
        sql.mockRejectedValue(Object.assign(new Error('Duplicado'), { code: '23505' }));

        const response = await request(app).patch('/api/ingredientes/7?usuario_id=1')
            .send({ nome: 'Ovos' });

        expect(response.status).toBe(409);
        expect(response.body).toEqual({ error: 'Ingrediente já cadastrado.' });
        expect(sql.mock.calls[0].slice(1)).toEqual(['ovo', 7]);
    });

    test('retorna 500 sem expor detalhes de erros inesperados', async () => {
        sql.mockRejectedValue(new Error('Detalhes internos da conexão'));
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const response = await request(app).patch('/api/ingredientes/7?usuario_id=1')
                .send({ nome: 'Coco ralado' });

            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Erro interno do servidor.' });
        } finally {
            consoleSpy.mockRestore();
        }
    });
});
