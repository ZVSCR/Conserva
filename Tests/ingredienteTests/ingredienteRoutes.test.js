const request = require('supertest');

jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/ingredienteRepository', () => ({
    createIngredienteRepo: jest.fn(),
    inserirIngredientesPadrao: jest.fn(),
    buscarIdsIngredientes: jest.fn()
}));

const { createIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository');
const app = require('../../Backend/src/app');

beforeEach(() => jest.clearAllMocks());

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
