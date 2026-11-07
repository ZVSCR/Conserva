jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(7));
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/receitaRepository', () => ({
    ...jest.requireActual('../../Backend/src/repositories/receitaRepository'),
    atualizarQuantidadeIngredienteReceitaRepo: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { atualizarQuantidadeIngredienteReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');
const app = express();
app.use(express.json());
app.use('/api/receitas', require('../../Backend/src/routes/receitaRoutes'));
const endpoint = '/api/receitas/9/ingredientes/88';
const vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '2.50', unidade_de_medida: 'kg' };

beforeEach(() => {
    jest.resetAllMocks();
    atualizarQuantidadeIngredienteReceitaRepo.mockResolvedValue(vinculo);
});

test.each([1, 7])('atualiza quantidade para a sessão %s sem aceitar IDs do corpo ou da query', async (usuarioId) => {
    const response = await request(app).patch(endpoint).set('X-Test-User', String(usuarioId))
        .query({ usuario_id: 1 }).send({ quantidade: 2.5, usuario_id: 1, ingrediente_id: 100, unidade_de_medida: 'L' });
    expect(response.status).toBe(200);
    expect(response.body.ingredienteAtualizado).toEqual(vinculo);
    expect(atualizarQuantidadeIngredienteReceitaRepo).toHaveBeenCalledWith(9, 88, 2.5, usuarioId);
});

test.each([0.01, 9999999.99])('aceita quantidade no limite: %s', async (quantidade) => {
    expect((await request(app).patch(endpoint).send({ quantidade })).status).toBe(200);
});

test.each([null, [], {}, { quantidade: 0 }, { quantidade: -1 }, { quantidade: '2' },
    { quantidade: null }, { quantidade: 0.001 }, { quantidade: 10000000 }])('rejeita corpo inválido: %j', async (body) => {
    expect((await request(app).patch(endpoint).send(body)).status).toBe(400);
    expect(atualizarQuantidadeIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test.each(['abc', '0', '-1', '1.5', '01', '2147483648', '9007199254740993'])('rejeita IDs inválidos: %s', async (id) => {
    expect((await request(app).patch(`/api/receitas/${id}/ingredientes/88`).send({ quantidade: 2 })).status).toBe(400);
    expect((await request(app).patch(`/api/receitas/9/ingredientes/${id}`).send({ quantidade: 2 })).status).toBe(400);
    expect(atualizarQuantidadeIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test('exige autenticação mesmo com usuario_id=1', async () => {
    const response = await request(app).patch(endpoint).set('X-Test-User', 'anonymous')
        .query({ usuario_id: 1 }).send({ usuario_id: 1, quantidade: 2 });
    expect(response.status).toBe(401);
    expect(atualizarQuantidadeIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test('retorna 404 quando o vínculo não existe ou não pode ser alterado pela sessão', async () => {
    atualizarQuantidadeIngredienteReceitaRepo.mockResolvedValue(undefined);
    expect((await request(app).patch(endpoint).send({ quantidade: 2 })).status).toBe(404);
});

test('retorna 500 sem revelar detalhes internos', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        atualizarQuantidadeIngredienteReceitaRepo.mockRejectedValue(new Error('detalhes privados'));
        const response = await request(app).patch(endpoint).send({ quantidade: 2 });
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ erro: 'Erro interno do servidor.' });
    } finally {
        spy.mockRestore();
    }
});
