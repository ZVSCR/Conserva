jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(7));
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/receitaRepository', () => ({
    ...jest.requireActual('../../Backend/src/repositories/receitaRepository'),
    removerIngredienteReceitaRepo: jest.fn()
}));

const express = require('express');
const request = require('supertest');
const { removerIngredienteReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');
const app = express();
app.use(express.json());
app.use('/api/receitas', require('../../Backend/src/routes/receitaRoutes'));
const endpoint = '/api/receitas/9/ingredientes/88';
const vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '1.25', unidade_de_medida: 'kg' };

beforeEach(() => {
    jest.resetAllMocks();
    removerIngredienteReceitaRepo.mockResolvedValue(vinculo);
});

test('remove o vínculo usando os IDs da URL e o usuário da sessão', async () => {
    const response = await request(app).delete(endpoint).set('X-Test-User', '42')
        .query({ usuario_id: 999 }).send({ usuario_id: 999, receita_id: 100, ingrediente_id: 200 });
    expect(response.status).toBe(200);
    expect(response.body.ingredienteRemovido).toEqual(vinculo);
    expect(removerIngredienteReceitaRepo).toHaveBeenCalledWith(9, 88, 42);
});

test('não exige corpo para remover um vínculo', async () => {
    expect((await request(app).delete(endpoint)).status).toBe(200);
    expect(removerIngredienteReceitaRepo).toHaveBeenCalledWith(9, 88, 7);
});

test('exige sessão mesmo com usuario_id informado', async () => {
    const response = await request(app).delete(endpoint).set('X-Test-User', 'anonymous')
        .query({ usuario_id: 7 }).send({ usuario_id: 7 });
    expect(response.status).toBe(401);
    expect(removerIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test.each(['abc', '0', '-1', '1.5', '01', '2147483648', '9007199254740993'])('rejeita IDs inválidos: %s', async (id) => {
    expect((await request(app).delete(`/api/receitas/${id}/ingredientes/88`)).status).toBe(400);
    expect((await request(app).delete(`/api/receitas/9/ingredientes/${id}`)).status).toBe(400);
    expect(removerIngredienteReceitaRepo).not.toHaveBeenCalled();
});

test('retorna 404 se nenhum vínculo acessível for removido', async () => {
    removerIngredienteReceitaRepo.mockResolvedValue(undefined);
    const response = await request(app).delete(endpoint);
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ erro: 'Ingrediente não encontrado nesta receita.' });
});

test('retorna 500 sem expor detalhes internos', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    try {
        removerIngredienteReceitaRepo.mockRejectedValue(new Error('detalhes privados'));
        const response = await request(app).delete(endpoint);
        expect(response.status).toBe(500);
        expect(response.body).toEqual({ erro: 'Erro interno do servidor.' });
    } finally {
        spy.mockRestore();
    }
});
