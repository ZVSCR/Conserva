jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(7));
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/receitaRepository', () => {
    const actual = jest.requireActual('../../Backend/src/repositories/receitaRepository');
    return { ...actual, inserirIngredienteReceitaRepo: jest.fn() };
});

const express = require('express');
const request = require('supertest');
const { inserirIngredienteReceitaRepo, ReceitaNaoEncontradaError, IngredienteNaoEncontradoError } = require('../../Backend/src/repositories/receitaRepository');
const app = express();
app.use(express.json());
app.use('/api/receitas', require('../../Backend/src/routes/receitaRoutes'));

const payload = { ingrediente_id: 88, quantidade: 1.25, unidade_de_medida: 'kg' };
const vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '1.25', unidade_de_medida: 'kg' };

beforeEach(() => {
    jest.resetAllMocks();
    inserirIngredienteReceitaRepo.mockResolvedValue(vinculo);
});

test('insere ingrediente usando somente a identidade da sessão', async () => {
    const response = await request(app).post('/api/receitas/9/ingredientes')
        .set('X-Test-User', '42').query({ usuario_id: 999 })
        .send({ ...payload, usuario_id: 999, receita_id: 100 });
    expect(response.status).toBe(201);
    expect(response.body.ingrediente).toEqual(vinculo);
    expect(inserirIngredienteReceitaRepo).toHaveBeenCalledWith(9, payload, 42);
});

test('exige autenticação mesmo com usuario_id no corpo e na query', async () => {
    const response = await request(app).post('/api/receitas/9/ingredientes')
        .set('X-Test-User', 'anonymous').query({ usuario_id: 7 })
        .send({ ...payload, usuario_id: 7 });
    expect(response.status).toBe(401);
    expect(inserirIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test.each(['abc', '0', '-1', '1.5', '01', '2147483648', '9007199254740993'])('rejeita id inválido: %s', async (id) => {
    const response = await request(app).post(`/api/receitas/${id}/ingredientes`).send(payload);
    expect(response.status).toBe(400);
    expect(inserirIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test.each([
    null, [], {}, { nome: 'Fubá', quantidade: 1.25, unidade_de_medida: 'kg' },
    ...[null, 0, -1, '88', 1.5, 2147483648, 9007199254740992].map(ingrediente_id => ({ ...payload, ingrediente_id })),
    { ...payload, quantidade: 0 }, { ...payload, quantidade: -1 },
    { ...payload, quantidade: '1' }, { ...payload, quantidade: 0.001 },
    { ...payload, quantidade: 10000000 }, { ...payload, unidade_de_medida: 'litros' }
])('valida o ingrediente antes de persistir: %j', async (body) => {
    const response = await request(app).post('/api/receitas/9/ingredientes').send(body);
    expect(response.status).toBe(400);
    expect(inserirIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test('retorna 404 para receita inexistente ou de outro usuário', async () => {
    inserirIngredienteReceitaRepo.mockRejectedValue(new ReceitaNaoEncontradaError());
    const response = await request(app).post('/api/receitas/9/ingredientes').send(payload);
    expect(response.status).toBe(404);
});

test('retorna 409 quando o ingrediente já está associado', async () => {
    inserirIngredienteReceitaRepo.mockRejectedValue(Object.assign(new Error(), { code: '23505' }));
    const response = await request(app).post('/api/receitas/9/ingredientes').send(payload);
    expect(response.status).toBe(409);
});

test('retorna 404 quando o ingrediente selecionado não existe', async () => {
    inserirIngredienteReceitaRepo.mockRejectedValue(new IngredienteNaoEncontradoError());
    const response = await request(app).post('/api/receitas/9/ingredientes').send(payload);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ erro: 'Ingrediente não encontrado.' });
});

test('retorna 500 sem expor o erro interno', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        inserirIngredienteReceitaRepo.mockRejectedValue(new Error('detalhes privados'));
        const response = await request(app).post('/api/receitas/9/ingredientes').send(payload);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ erro: 'Erro interno do servidor.' });
    } finally {
        consoleSpy.mockRestore();
    }
});
