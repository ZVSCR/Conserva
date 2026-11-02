jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
const pool = require('../../Backend/src/config/transactionDatabase');
const { atualizarPorCompraId, atualizarInstanciasPorCompraId } = require('../../Backend/src/repositories/compraRepository');
const { PrecoInvalidoError } = require('../../Backend/src/services/precoService');

function clienteComItem(overrides = {}, quantidadeSelecionada = 2) {
    const atual = {
        id: 1, compra_id: 42, nome_item: 'Produto', quantidade: '0.50',
        quantidade_disponivel: '0.20', estoque_id: 10, unidade_de_medida: 'kg',
        tipo_medida: 'variavel', valor_unitario: '15.99', ...overrides
    };
    const client = {
        query: jest.fn(async (query, params) => {
            if (query.includes('SELECT i.*')) return { rows: [atual] };
            if (query.includes('SELECT i.id, e.id AS estoque_id')) {
                return { rows: Array.from({ length: quantidadeSelecionada }, (_, id) => ({ id: id + 1, estoque_id: id + 10 })) };
            }
            if (query.includes('UPDATE item')) return { rows: [{ ...atual, valor_unitario: params[2] ?? atual.valor_unitario }] };
            if (query.includes('UPDATE compra') || query.includes('SELECT id, valor_total')) return { rows: [{ id: 42 }] };
            return { rows: [] };
        }),
        release: jest.fn()
    };
    pool.connect.mockResolvedValue(client);
    return client;
}

beforeEach(() => jest.clearAllMocks());

test.each([{ validade_estimada: null }, { nome_item: 'Produto' }, { preco_total_item: 8 }])(
    'preserva o unitário original ao salvar metadados ou repetir o total: %j', async alteracoes => {
        const client = clienteComItem();
        await atualizarPorCompraId(7, 1, 42, alteracoes);
        const update = client.query.mock.calls.find(([query]) => query.includes('UPDATE item'));
        expect(update[1][2]).toBeNull();
        expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE estoque'))).toBe(false);
        expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE compra'))).toBe(false);
    }
);

test('converte o preço usando a quantidade original mesmo após consumo', async () => {
    const client = clienteComItem();
    await atualizarPorCompraId(7, 1, 42, { preco_total_item: 10 });
    expect(client.query.mock.calls.find(([query]) => query.includes('UPDATE item'))[1][2]).toBe(20);
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE estoque'))).toBe(false);
    expect(client.query.mock.calls[1][0]).toContain('SELECT id FROM compra');
    expect(client.query.mock.calls[1][0]).toContain('FOR UPDATE');
});

test('converte também ao trocar a unidade, sem multiplicar novamente o total', async () => {
    const client = clienteComItem({ quantidade_disponivel: '0.50', valor_unitario: '20.00' });
    await atualizarPorCompraId(7, 1, 42, { quantidade: 500, unidade_de_medida: 'g', preco_total_item: 10 });
    expect(client.query.mock.calls.find(([query]) => query.includes('UPDATE item'))[1].slice(0, 3)).toEqual([500, 'g', 0.02]);
});

test('quantidade corrigida que não conserva o total causa rollback antes da escrita', async () => {
    const client = clienteComItem({ quantidade: '2.00', quantidade_disponivel: '2.00', valor_unitario: '5.00', unidade_de_medida: 'un', tipo_medida: 'unitaria' });
    await expect(atualizarPorCompraId(7, 1, 42, { quantidade: 3 })).rejects.toBeInstanceOf(PrecoInvalidoError);
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE item'))).toBe(false);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
});

test('o total coletivo cobre todas as embalagens selecionadas', async () => {
    const client = clienteComItem();
    const seletor = { nome_item: 'Produto', quantidade: 0.5, unidade_de_medida: 'kg', valor_unitario: 20, validade_estimada: null };
    await atualizarInstanciasPorCompraId(7, 42, seletor, { preco_total_item: 18 });
    expect(client.query.mock.calls.find(([query]) => query.includes('UPDATE item'))[1][0]).toBe(18);
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE estoque'))).toBe(false);
});

test('rejeita total coletivo impossível sem alterar parte das embalagens', async () => {
    const client = clienteComItem({}, 3);
    const seletor = { nome_item: 'Produto', quantidade: 0.5, unidade_de_medida: 'kg', valor_unitario: 20, validade_estimada: null };
    await expect(atualizarInstanciasPorCompraId(7, 42, seletor, { preco_total_item: 10 })).rejects.toBeInstanceOf(PrecoInvalidoError);
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE item'))).toBe(false);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
});

test('repetir total coletivo com centavos preserva o preço original de cada embalagem', async () => {
    const client = clienteComItem({}, 3);
    const seletor = { nome_item: 'Produto', quantidade: 0.5, unidade_de_medida: 'kg', valor_unitario: 0.19, validade_estimada: null };
    await atualizarInstanciasPorCompraId(7, 42, seletor, { preco_total_item: 0.3 });
    expect(client.query.mock.calls.find(([query]) => query.includes('UPDATE item'))[1][0]).toBeNull();
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE compra'))).toBe(false);
});
