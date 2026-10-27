const request = require('supertest');
const app = require('../../Backend/src/app');

jest.mock('../../Backend/src/config/database.js', () => ({
    query: jest.fn()
}));

jest.mock('../../Backend/src/repositories/estoqueRepository', () => ({
    buscarEstoque: jest.fn(),
    atualizarQuantidade: jest.fn(),
    buscarDetalheEstoque: jest.fn(),
    buscarValorEstoquePorUsuario: jest.fn(),
    buscarItensEstoquePorUsuario: jest.fn(),
    buscarConsumo: jest.fn()
}));

const estoqueRepo = require('../../Backend/src/repositories/estoqueRepository');

// resetAllMocks (e não clearAllMocks) pra um mockRejectedValue não vazar pro teste seguinte
beforeEach(() => {
    jest.resetAllMocks();
});

const rotasDeLeitura = [
    ['/api/estoque', 'buscarEstoque'],
    ['/api/estoque/gastos', 'buscarValorEstoquePorUsuario'],
    ['/api/estoque/consumo', 'buscarConsumo'],
    ['/api/estoque/itens', 'buscarItensEstoquePorUsuario']
];

describe.each(rotasDeLeitura)('GET %s', (rota, funcaoRepo) => {

    test('deve retornar 400 se usuario_id não foi enviado.', async () => {
        const response = await request(app).get(rota);

        expect(response.status).toBe(400);
        expect(estoqueRepo[funcaoRepo]).not.toHaveBeenCalled();
    });

    test.each(['abc', '0', '-1', '1.5'])('deve retornar 400 se usuario_id é "%s".', async (valor) => {
        const response = await request(app)
            .get(rota)
            .query({ usuario_id: valor });

        expect(response.status).toBe(400);
    });

    test('deve usar o usuario_id enviado, e não o usuário fixo 1.', async () => {
        estoqueRepo[funcaoRepo].mockResolvedValue([]);

        const response = await request(app)
            .get(rota)
            .query({ usuario_id: 7 });

        expect(response.status).toBe(200);
        expect(estoqueRepo[funcaoRepo]).toHaveBeenCalledWith(7);
    });

    test('deve retornar 500 quando o repository falha.', async () => {
        estoqueRepo[funcaoRepo].mockRejectedValue(new Error('Erro de banco'));

        const response = await request(app)
            .get(rota)
            .query({ usuario_id: 7 });

        expect(response.status).toBe(500);
    });
});

describe('PATCH /api/estoque/:itemId', () => {

    // Detalhe de um item de variável, comprado em 5 unidades de medida
    // (NUMERIC do Postgres chega como string, como no uso real)
    const detalheVariavel = { quantidade_original: '5.00', tipo_medida: 'variavel' };
    const detalheUnitario = { quantidade_original: '5.00', tipo_medida: 'unitaria' };

    const patch = (itemId = 5) =>
        request(app).patch(`/api/estoque/${itemId}`).query({ usuario_id: 7 });

    test('deve retornar 400 se usuario_id não foi enviado.', async () => {
        const response = await request(app)
            .patch('/api/estoque/5')
            .send({ quantidade: 2 });

        expect(response.status).toBe(400);
        expect(estoqueRepo.buscarDetalheEstoque).not.toHaveBeenCalled();
    });

    test.each(['abc', '0', '1.5'])('deve retornar 400 se itemId é "%s".', async (itemId) => {
        const response = await patch(itemId).send({ quantidade: 2 });

        expect(response.status).toBe(400);
    });

    test.each([
        ['texto', 'dez'],
        ['número em texto', '2'],
        ['negativa', -1],
        ['com três casas decimais', 2.555]
    ])('deve retornar 400 se a quantidade é %s.', async (_descricao, quantidade) => {
        const response = await patch().send({ quantidade });

        expect(response.status).toBe(400);
        expect(estoqueRepo.buscarDetalheEstoque).not.toHaveBeenCalled();
    });

    test('deve retornar 404 se o item não existe no estoque do usuário.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(undefined);

        const response = await patch().send({ quantidade: 2 });

        expect(response.status).toBe(404);
        expect(estoqueRepo.buscarDetalheEstoque).toHaveBeenCalledWith(7, 5);
        expect(estoqueRepo.atualizarQuantidade).not.toHaveBeenCalled();
    });

    test('deve retornar 400 se a quantidade passa da quantidade original.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(detalheVariavel);

        const response = await patch().send({ quantidade: 6 });

        expect(response.status).toBe(400);
        expect(estoqueRepo.atualizarQuantidade).not.toHaveBeenCalled();
    });

    test('deve retornar 400 se item unitário recebe quantidade fracionada.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(detalheUnitario);

        const response = await patch().send({ quantidade: 2.5 });

        expect(response.status).toBe(400);
        expect(estoqueRepo.atualizarQuantidade).not.toHaveBeenCalled();
    });

    test('deve retornar 409 se o UPDATE não atualiza nenhuma linha.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(detalheVariavel);
        estoqueRepo.atualizarQuantidade.mockResolvedValue(undefined);

        const response = await patch().send({ quantidade: 2 });

        expect(response.status).toBe(409);
    });

    test('deve atualizar o estoque do usuário enviado e retornar 200.', async () => {
        const atualizado = { id: 1, item_id: 5, quantidade_disponivel: '2.00' };
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(detalheVariavel);
        estoqueRepo.atualizarQuantidade.mockResolvedValue(atualizado);

        const response = await patch().send({ quantidade: 2 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual(atualizado);
        expect(estoqueRepo.atualizarQuantidade).toHaveBeenCalledWith(7, 5, 2);
    });

    test('deve aceitar quantidade igual à original.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockResolvedValue(detalheVariavel);
        estoqueRepo.atualizarQuantidade.mockResolvedValue({ id: 1 });

        const response = await patch().send({ quantidade: 5 });

        expect(response.status).toBe(200);
    });

    test('deve retornar 500 quando o repository falha.', async () => {
        estoqueRepo.buscarDetalheEstoque.mockRejectedValue(new Error('Erro de banco'));

        const response = await patch().send({ quantidade: 2 });

        expect(response.status).toBe(500);
    });
});