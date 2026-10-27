const request = require('supertest');
jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(1));

jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/ingredienteRepository', () => ({
    createIngredienteRepo: jest.fn(),
    inserirIngredientesPadrao: jest.fn(),
    buscarIdsIngredientes: jest.fn(),
    deleteIngredienteRepo: jest.fn()
}));

const { createIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');
const app = require('../../Backend/src/app');

beforeEach(() => jest.clearAllMocks());

const { deleteIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');

describe('DELETE /api/ingredientes/:id', () => {
    test('administrador recebe 204 ao excluir ingrediente', async () => {
        deleteIngredienteRepo.mockResolvedValue({ id: 12 });
        const response = await request(app).delete('/api/ingredientes/12');
        expect(response.status).toBe(204);
        expect(response.text).toBe('');
        expect(deleteIngredienteRepo).toHaveBeenCalledWith(12);
    });

    test('usuário comum recebe 403 sem consultar o banco', async () => {
        const response = await request(app).delete('/api/ingredientes/12').set('X-Test-User', '2');
        expect(response.status).toBe(403);
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test.each(['', '?usuario_id=1', '?usuario_id=999'])('rejeita requisição sem sessão: %s', async (query) => {
        const response = await request(app).delete(`/api/ingredientes/12${query}`)
            .set('X-Test-User', 'anonymous');
        expect(response.status).toBe(401);
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test('não aceita usuario_id do corpo como substituto da sessão', async () => {
        const response = await request(app).delete('/api/ingredientes/12')
            .set('X-Test-User', 'anonymous').send({ usuario_id: 1 });
        expect(response.status).toBe(401);
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test.each(['0', '-1', 'abc', '1.5', '12abc', '1e2', '9007199254740992'])('rejeita ID de ingrediente %s', async (id) => {
        const response = await request(app).delete(`/api/ingredientes/${id}`);
        expect(response.status).toBe(400);
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test('ingrediente inexistente recebe 404', async () => {
        deleteIngredienteRepo.mockResolvedValue(undefined);
        const response = await request(app).delete('/api/ingredientes/999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ error: 'Ingrediente não encontrado.' });
    });

    test('falha inesperada recebe 500 sem detalhes internos', async () => {
        deleteIngredienteRepo.mockRejectedValue(new Error('Detalhes privados do banco'));
        const log = jest.spyOn(console, 'error').mockImplementation(() => {});
        try {
            const response = await request(app).delete('/api/ingredientes/12');
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ error: 'Erro interno do servidor.' });
        } finally {
            log.mockRestore();
        }
    });
});

test('POST /api/ingredientes cria um nome canônico a partir de um alias', async () => {
    createIngredienteRepo.mockResolvedValue({ id: 12, nome: 'ovo' });

    const response = await request(app)
        .post('/api/ingredientes')
        .send({ nome: 'Ovos' });

    expect(response.status).toBe(201);
    expect(response.body.ingrediente).toEqual({ id: 12, nome: 'ovo' });
    expect(createIngredienteRepo).toHaveBeenCalledWith('ovo');
});

test('POST /api/ingredientes preserva nomes novos normalizados', async () => {
    createIngredienteRepo.mockResolvedValue({ id: 13, nome: 'coco ralado' });

    const response = await request(app)
        .post('/api/ingredientes')
        .send({ nome: 'Coco Ralado' });

    expect(response.status).toBe(201);
    expect(createIngredienteRepo).toHaveBeenCalledWith('coco ralado');
});

test('POST /api/ingredientes mantém conflito para nome já cadastrado', async () => {
    createIngredienteRepo.mockRejectedValue(Object.assign(new Error('Duplicado'), { code: '23505' }));

    const response = await request(app)
        .post('/api/ingredientes')
        .send({ nome: 'Ovos' });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({ error: 'Ingrediente já cadastrado.' });
});

test('POST /api/ingredientes rejeita nome inválido sem consultar o banco', async () => {
    const response = await request(app)
        .post('/api/ingredientes')
        .send({ nome: '!!!' });

    expect(response.status).toBe(400);
    expect(createIngredienteRepo).not.toHaveBeenCalled();
});
