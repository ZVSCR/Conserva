jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(42));
const express = require('express');
const request = require('supertest');
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/services/receitaPreparoService', () => ({
    verificarReceitaService: jest.fn(), prepararReceitaService: jest.fn()
}));

const { verificarReceitaService, prepararReceitaService } = require('../../Backend/src/services/receitaPreparoService');
const { ReceitaNaoEncontradaError, IngredientesInsuficientesError } = require('../../Backend/src/repositories/receitaRepository');
const app = express();
app.use(express.json());
app.use('/api/receitas', require('../../Backend/src/routes/receitaRoutes'));
beforeEach(() => jest.resetAllMocks());

test.each([7, 42])('consulta disponibilidade no estoque da sessão %s', async (id) => {
    verificarReceitaService.mockResolvedValue({ ok: true, faltando: [] });
    const response = await request(app).get('/api/receitas/9/disponibilidade')
        .set('X-Test-User', String(id)).query({ usuario_id: 999 });
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ podePreparar: true, faltando: [] });
    expect(verificarReceitaService).toHaveBeenCalledWith(id, 9);
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test.each([7, 42])('registra preparo para a sessão %s e ignora o corpo adulterado', async (id) => {
    const resultado = { receita_preparada_id: 123, usos: [] };
    prepararReceitaService.mockResolvedValue(resultado);
    const response = await request(app).post('/api/receitas/9/preparar')
        .set('X-Test-User', String(id)).send({ usuario_id: 999 });
    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(resultado);
    expect(prepararReceitaService).toHaveBeenCalledWith(id, 9);
});

test.each(['get', 'post'])('%s não aceita usuario_id como substituto da sessão', async (method) => {
    const path = method === 'get' ? '/api/receitas/9/disponibilidade' : '/api/receitas/9/preparar';
    const response = await request(app)[method](path).set('X-Test-User', 'anonymous')
        .query({ usuario_id: 42 }).send({ usuario_id: 42 });
    expect(response.status).toBe(401);
    expect(verificarReceitaService).not.toHaveBeenCalled();
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test('preparo pode usar a sessão sem usuario_id no corpo', async () => {
    prepararReceitaService.mockResolvedValue({ receita_preparada_id: 1, usos: [] });
    const response = await request(app).post('/api/receitas/9/preparar');
    expect(response.status).toBe(201);
    expect(prepararReceitaService).toHaveBeenCalledWith(42, 9);
});

test.each(['abc', '0', '-1', '1.5'])('rejeita receitaId inválido: %s', async (id) => {
    expect((await request(app).get('/api/receitas/' + id + '/disponibilidade')).status).toBe(400);
    expect((await request(app).post('/api/receitas/' + id + '/preparar')).status).toBe(400);
    expect(verificarReceitaService).not.toHaveBeenCalled();
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test('mantém 404 para receita inexistente ou não acessível', async () => {
    prepararReceitaService.mockRejectedValue(new ReceitaNaoEncontradaError());
    expect((await request(app).post('/api/receitas/9/preparar')).status).toBe(404);
});

test('mantém 409 e os ingredientes faltantes quando o estoque é insuficiente', async () => {
    const faltando = [{ ingrediente_id: 5, motivo: 'sem_estoque' }];
    prepararReceitaService.mockRejectedValue(new IngredientesInsuficientesError(faltando));
    const response = await request(app).post('/api/receitas/9/preparar');
    expect(response.status).toBe(409);
    expect(response.body.faltando).toEqual(faltando);
});
