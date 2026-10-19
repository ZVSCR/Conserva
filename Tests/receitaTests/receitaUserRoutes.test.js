const express = require('express');
const request = require('supertest');

jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/services/receitaPreparoService', () => ({
    verificarReceitaService: jest.fn(),
    prepararReceitaService: jest.fn()
}));

const {
    verificarReceitaService,
    prepararReceitaService
} = require('../../Backend/src/services/receitaPreparoService');
const {
    ReceitaNaoEncontradaError,
    IngredientesInsuficientesError
} = require('../../Backend/src/repositories/receitaRepository');

const app = express();
app.use(express.json());
app.use('/api/receitas', require('../../Backend/src/routes/receitaRoutes'));

beforeEach(() => jest.resetAllMocks());

test.each([7, 42])('consulta disponibilidade no estoque do usuário %s', async (usuario_id) => {
    verificarReceitaService.mockResolvedValue({ ok: true, faltando: [] });

    const response = await request(app).get('/api/receitas/9/disponibilidade')
        .query({ usuario_id });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ podePreparar: true, faltando: [] });
    expect(verificarReceitaService).toHaveBeenCalledWith(usuario_id, 9);
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test.each([7, 42])('registra preparo para o usuário %s informado no JSON', async (usuario_id) => {
    const resultado = { receita_preparada_id: 123, usos: [] };
    prepararReceitaService.mockResolvedValue(resultado);

    const response = await request(app).post('/api/receitas/9/preparar')
        .send({ usuario_id });

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual(resultado);
    expect(prepararReceitaService).toHaveBeenCalledWith(usuario_id, 9);
});

test.each([undefined, '', '0', '-1', '1.5', 'abc', '9007199254740992', ['7', '42']])(
    'rejeita usuario_id inválido na consulta: %s', async (usuario_id) => {
        const response = await request(app).get('/api/receitas/9/disponibilidade')
            .query(usuario_id === undefined ? {} : { usuario_id });

        expect(response.status).toBe(400);
        expect(response.body.error).toEqual([expect.objectContaining({ field: 'usuario_id' })]);
        expect(verificarReceitaService).not.toHaveBeenCalled();
    }
);

test.each([undefined, null, 0, -1, 1.5, '42', {}, [], 9007199254740992])(
    'rejeita usuario_id inválido no preparo: %s', async (usuario_id) => {
        const response = await request(app).post('/api/receitas/9/preparar')
            .send({ usuario_id });

        expect(response.status).toBe(400);
        expect(prepararReceitaService).not.toHaveBeenCalled();
    }
);

test('preparo sem corpo não utiliza usuário padrão nem aceita ID pela query', async () => {
    const response = await request(app).post('/api/receitas/9/preparar?usuario_id=42');
    expect(response.status).toBe(400);
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test.each(['abc', '0', '-1', '1.5'])('rejeita receitaId inválido: %s', async (id) => {
    const consulta = await request(app).get(`/api/receitas/${id}/disponibilidade`)
        .query({ usuario_id: 42 });
    const preparo = await request(app).post(`/api/receitas/${id}/preparar`)
        .send({ usuario_id: 42 });

    expect(consulta.status).toBe(400);
    expect(preparo.status).toBe(400);
    expect(verificarReceitaService).not.toHaveBeenCalled();
    expect(prepararReceitaService).not.toHaveBeenCalled();
});

test('mantém a resposta 404 para receita inexistente', async () => {
    prepararReceitaService.mockRejectedValue(new ReceitaNaoEncontradaError());
    const response = await request(app).post('/api/receitas/9/preparar')
        .send({ usuario_id: 42 });
    expect(response.status).toBe(404);
});

test('mantém a resposta 409 e ingredientes faltantes para estoque insuficiente', async () => {
    const faltando = [{ ingrediente_id: 5, motivo: 'sem_estoque' }];
    prepararReceitaService.mockRejectedValue(new IngredientesInsuficientesError(faltando));
    const response = await request(app).post('/api/receitas/9/preparar')
        .send({ usuario_id: 42 });
    expect(response.status).toBe(409);
    expect(response.body.faltando).toEqual(faltando);
});
