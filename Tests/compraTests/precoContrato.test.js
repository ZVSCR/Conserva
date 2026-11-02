const request = require('supertest');
jest.mock('../../Backend/src/middleware/requireAuth', () => require('../helpers/authenticatedUser')(7));
jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    ...jest.requireActual('../../Backend/src/repositories/compraRepository'),
    createCompraRepo: jest.fn(), adicionaItensACompraRepo: jest.fn(),
    atualizarPorCompraId: jest.fn(), atualizarInstanciasPorCompraId: jest.fn()
}));
jest.mock('../../Backend/src/repositories/itemRepository', () => ({
    ...jest.requireActual('../../Backend/src/repositories/itemRepository'), atualizarPorId: jest.fn()
}));
const repo = require('../../Backend/src/repositories/compraRepository');
const itemRepo = require('../../Backend/src/repositories/itemRepository');
const app = require('../../Backend/src/app');
const item = { nome_item: 'Produto', quantidade: 3, unidade_de_medida: 'un', preco_total_item: 6 };

beforeEach(() => {
    jest.clearAllMocks();
    repo.createCompraRepo.mockResolvedValue({ id: 42 });
    repo.adicionaItensACompraRepo.mockResolvedValue({ id: 42 });
    repo.atualizarPorCompraId.mockResolvedValue({ item: { id: 10, preco_total_item: 6 } });
    repo.atualizarInstanciasPorCompraId.mockResolvedValue({ itens: [{ id: 10 }] });
    itemRepo.atualizarPorId.mockResolvedValue({ id: 10, preco_total_item: 6 });
});

test.each([
    ['/api/compras', { estabelecimento: 'Mercado', itens: [item] }, 'createCompraRepo', 201],
    ['/api/compras/42/items', { itens: [item] }, 'adicionaItensACompraRepo', 200],
    ['/api/items', { ...item, compra_id: 42 }, 'adicionaItensACompraRepo', 201]
])('%s converte total em preço unitário antes de persistir', async (url, body, metodo, status) => {
    const response = await request(app).post(url).send(body);
    expect(response.status).toBe(status);
    expect(repo[metodo]).toHaveBeenCalledWith(expect.objectContaining({
        usuario_id: 7, itens: [expect.objectContaining({ quantidade: 3, valor_unitario: 2 })]
    }));
    expect(repo[metodo].mock.calls[0][0].itens[0]).not.toHaveProperty('preco_total_item');
});

test.each(['/api/compras', '/api/compras/42/items', '/api/items'])(
    '%s rejeita total não representável antes da persistência', async url => {
        const impossivel = { ...item, preco_total_item: 10 };
        const body = url === '/api/compras' ? { estabelecimento: 'Mercado', itens: [impossivel] }
            : url === '/api/items' ? { ...impossivel, compra_id: 42 } : { itens: [impossivel] };
        const response = await request(app).post(url).send(body);
        expect(response.status).toBe(400);
        expect(JSON.stringify(response.body)).toMatch(/não pode ser representado/);
        expect(repo.createCompraRepo).not.toHaveBeenCalled();
        expect(repo.adicionaItensACompraRepo).not.toHaveBeenCalled();
    }
);

test.each(['/api/compras/42/items/10', '/api/items/10'])(
    '%s encaminha o total para conversão com os dados atuais do banco', async url => {
        const response = await request(app).patch(url).send({ preco_total_item: 6 });
        expect(response.status).toBe(200);
        const chamada = url.startsWith('/api/compras') ? repo.atualizarPorCompraId.mock.calls[0][3]
            : itemRepo.atualizarPorId.mock.calls[0][1];
        expect(chamada).toEqual(expect.objectContaining({ preco_total_item: 6 }));
        expect(chamada).not.toHaveProperty('valor_unitario');
    }
);

test.each([false, true])('recusa valor_unitario na criação, inclusive combinado com total: %s', async ambos => {
    const body = { ...item, valor_unitario: 2 };
    if (!ambos) delete body.preco_total_item;
    expect((await request(app).post('/api/compras').send({ estabelecimento: 'Mercado', itens: [body] })).status).toBe(400);
    expect(repo.createCompraRepo).not.toHaveBeenCalled();
});

test.each(['/api/compras/42/items/10', '/api/items/10'])('%s rejeita preço unitário fornecido pelo cliente', async url => {
    expect((await request(app).patch(url).send({ valor_unitario: 2, preco_total_item: 6 })).status).toBe(400);
    expect(repo.atualizarPorCompraId).not.toHaveBeenCalled();
    expect(itemRepo.atualizarPorId).not.toHaveBeenCalled();
});

test('edição coletiva mantém o preço antigo só no seletor e recebe um novo total', async () => {
    const itemBusca = { nome_item: 'Produto', quantidade: 0.5, unidade_de_medida: 'kg', valor_unitario: 20 };
    const response = await request(app).patch('/api/compras/42/items')
        .send({ itemBusca, novosValores: { preco_total_item: 18 } });
    expect(response.status).toBe(200);
    expect(repo.atualizarInstanciasPorCompraId).toHaveBeenCalledWith(7, 42,
        expect.objectContaining({ valor_unitario: 20 }), expect.objectContaining({ preco_total_item: 18 }));
    expect((await request(app).patch('/api/compras/42/items')
        .send({ itemBusca, novosValores: { valor_unitario: 18 } })).status).toBe(400);
});
