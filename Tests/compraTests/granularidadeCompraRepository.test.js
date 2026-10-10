jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const pool = require('../../Backend/src/config/transactionDatabase');
const { createCompraRepo, adicionaItensACompraRepo } = require('../../Backend/src/repositories/compraRepository');

function criarCliente() {
    let proximoItemId = 100;
    const client = {
        query: jest.fn(async (query) => {
            if (/INSERT INTO compra|UPDATE compra/.test(query)) return { rows: [{ id: 42 }] };
            if (/INSERT INTO item/.test(query)) return { rows: [{ id: proximoItemId++ }] };
            return { rows: [] };
        }),
        release: jest.fn()
    };
    pool.connect.mockResolvedValue(client);
    return client;
}

const maca = {
    nome_item: 'Maçã', quantidade: 3, unidade_de_medida: 'un',
    tipo_medida: 'unitaria', valor_unitario: 2, validade_estimada: null
};
const granola = {
    nome_item: 'Granola', quantidade: 0.5, unidade_de_medida: 'kg',
    tipo_medida: 'variavel', valor_unitario: 20, validade_estimada: null
};

beforeEach(() => jest.clearAllMocks());

test('cria um lote unitário e duas embalagens variáveis na mesma transação', async () => {
    const client = criarCliente();

    await createCompraRepo({
        usuario_id: 7, estabelecimento: 'Mercado', valor_total: 26,
        itens: [maca, granola, granola]
    });

    const insercoes = client.query.mock.calls.filter(([query]) => /INSERT INTO item/.test(query));
    const estoques = client.query.mock.calls.filter(([query]) => /INSERT INTO estoque/.test(query));
    expect(insercoes).toHaveLength(3);
    expect(estoques).toHaveLength(3);
    expect(insercoes.map(([, values]) => values[4])).toEqual(['unitaria', 'variavel', 'variavel']);
    expect(estoques.map(([, values]) => values[2])).toEqual([3, 0.5, 0.5]);
    expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
});

test('adiciona uma linha de estoque para cada embalagem nova', async () => {
    const client = criarCliente();

    await adicionaItensACompraRepo({
        usuario_id: 7, compra_id: 42, valor_itens_novos: '20.00',
        itens: [granola, granola]
    });

    expect(client.query.mock.calls.filter(([query]) => /INSERT INTO item/.test(query))).toHaveLength(2);
    expect(client.query.mock.calls.filter(([query]) => /INSERT INTO estoque/.test(query))).toHaveLength(2);
    expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
});
