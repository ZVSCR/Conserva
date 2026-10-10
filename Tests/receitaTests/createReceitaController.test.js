const request = require('supertest');

jest.mock('../../Backend/src/config/database.js', () => ({}));
// O app carrega todas as rotas; as de compra são mockadas para não abrir conexão.
jest.mock('../../Backend/src/repositories/compraRepository.js', () => ({
    atualizarPorCompraId: jest.fn(),
    createCompraRepo: jest.fn()
}));
jest.mock('../../Backend/src/repositories/receitaRepository.js', () => ({
    createReceitaRepo: jest.fn()
}));
jest.mock('../../Backend/src/services/receitaService.js', () => ({
    createReceitaService: jest.fn()
}));

const app = require('../../Backend/src/app');
const { createReceitaService } = require('../../Backend/src/services/receitaService');

const endpoint = '/api/receitas';

const receitaValida = {
    nome: 'Bolo de Fubá',
    descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
    modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.'
};

beforeEach(() => {
    jest.clearAllMocks();
});

test('cria receita e responde 201 com o id da receita criada', async () => {
    createReceitaService.mockResolvedValue({ id: 123 });

    const response = await request(app)
        .post(endpoint)
        .send(receitaValida);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('Receita registrada com sucesso.');
    expect(response.body.receita).toEqual({ id: 123 });
    expect(createReceitaService).toHaveBeenCalledTimes(1);
    expect(createReceitaService).toHaveBeenCalledWith(receitaValida);
});

test.each([
    ['nome ausente', { nome: undefined }, 'nome'],
    ['nome só com espaços', { nome: '   ' }, 'nome'],
    ['nome acima do limite', { nome: 'a'.repeat(101) }, 'nome'],
    ['descrição não textual', { descricao: 10 }, 'descricao'],
    ['descrição acima do limite', { descricao: 'a'.repeat(1001) }, 'descricao'],
    ['modo de preparo nulo', { modo_preparo: null }, 'modo_preparo'],
    ['modo de preparo acima do limite', { modo_preparo: 'a'.repeat(10001) }, 'modo_preparo']
])('rejeita %s sem chamar o serviço', async (_caseName, overrides, field) => {
    const response = await request(app)
        .post(endpoint)
        .send({ ...receitaValida, ...overrides });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
        expect.objectContaining({ field })
    ]);
    expect(createReceitaService).not.toHaveBeenCalled();
});

test('retorna todos os erros de validação de uma vez', async () => {
    const response = await request(app)
        .post(endpoint)
        .send({});

    expect(response.status).toBe(400);
    expect(response.body.errors.map(erro => erro.field)).toEqual([
        'nome',
        'descricao',
        'modo_preparo'
    ]);
    expect(createReceitaService).not.toHaveBeenCalled();
});

test('rejeita payload que não seja um objeto', async () => {
    const response = await request(app)
        .post(endpoint)
        .send([]);

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual([
        expect.objectContaining({ field: 'payload' })
    ]);
    expect(createReceitaService).not.toHaveBeenCalled();
});

test('responde com erro interno quando o serviço falha, sem expor detalhes', async () => {
    createReceitaService.mockRejectedValue(new Error('Falha simulada'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    try {
        const response = await request(app)
            .post(endpoint)
            .send(receitaValida);

        expect(response.status).toBe(500);
        expect(response.body).toEqual({ error: 'Erro interno do servidor.' });
        expect(JSON.stringify(response.body)).not.toContain('Falha simulada');
        expect(consoleSpy).toHaveBeenCalled();
    } finally {
        consoleSpy.mockRestore();
    }
});