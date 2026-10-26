jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(1));

const request = require('supertest');

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

describe('DELETE /api/ingredientes/:id desativada', () => {
    test.each(['12', '999', 'abc', '0'])('recusa exclusão de %s antes de qualquer consulta', async (id) => {
        const response = await request(app).delete('/api/ingredientes/' + id).query({ usuario_id: 1 });
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('A exclusão de ingredientes está indisponível.');
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
    });

    test('nem o usuário anteriormente considerado administrador ativa a exclusão', async () => {
        const response = await request(app).delete('/api/ingredientes/12').set('X-Test-User', '1');
        expect(response.status).toBe(403);
        expect(deleteIngredienteRepo).not.toHaveBeenCalled();
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
