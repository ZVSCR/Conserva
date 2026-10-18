jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const pool = require('../../Backend/src/config/transactionDatabase');
const {
    createCompraRepo,
    adicionaItensACompraRepo,
    atualizarPorCompraId,
    atualizarInstanciasPorCompraId
} = require('../../Backend/src/repositories/compraRepository');

function criarCliente(ingredientes = { leite: 7, maca: 9 }) {
    let proximoItemId = 100;
    const client = {
        query: jest.fn(async (query, parametros) => {
            if (/SELECT i\.\*/.test(query)) {
                return { rows: [{
                    id: 100, compra_id: 42, nome_item: 'Produto', quantidade: '1.00',
                    unidade_de_medida: 'L', tipo_medida: 'variavel', valor_unitario: '4.00',
                    validade_estimada: null, estoque_id: 300, quantidade_disponivel: '1.00'
                }] };
            }
            if (/SELECT i\.id, e\.id AS estoque_id/.test(query)) {
                return { rows: [{ id: 100, estoque_id: 300 }, { id: 101, estoque_id: 301 }] };
            }
            if (/FROM receita_preparada_estoque/.test(query)) return { rows: [] };
            if (/FROM ingrediente/.test(query)) {
                return {
                    rows: parametros[0]
                        .filter((nome) => ingredientes[nome] !== undefined)
                        .map((nome) => ({ nome, id: ingredientes[nome] }))
                };
            }
            if (/INSERT INTO compra|UPDATE compra/.test(query)) return { rows: [{ id: 42 }] };
            if (/INSERT INTO item/.test(query)) return { rows: [{ id: proximoItemId++ }] };
            if (/UPDATE item/.test(query)) {
                return { rows: [{ id: 100, ingrediente_id: parametros.at(-1) }] };
            }
            return { rows: [] };
        }),
        release: jest.fn()
    };
    pool.connect.mockResolvedValue(client);
    return client;
}

function item(nome_item) {
    return {
        nome_item, quantidade: 1, unidade_de_medida: 'L',
        tipo_medida: 'variavel', valor_unitario: 4, validade_estimada: null
    };
}

beforeEach(() => jest.clearAllMocks());

test('dois nomes comerciais compartilham o mesmo ingrediente sem fundir seus estoques', async () => {
    const client = criarCliente();
    await createCompraRepo({
        usuario_id: 1, valor_total: 12, estabelecimento: 'Mercado',
        itens: [item('Leite A'), item('Leite B'), item('Produto desconhecido')]
    });

    const consultas = client.query.mock.calls;
    const busca = consultas.find(([query]) => /FROM ingrediente/.test(query));
    const insercoes = consultas.filter(([query]) => /INSERT INTO item/.test(query));
    const estoques = consultas.filter(([query]) => /INSERT INTO estoque/.test(query));
    expect(consultas[0][0]).toBe('BEGIN');
    expect(busca[1]).toEqual([['leite']]);
    expect(insercoes).toHaveLength(3);
    expect(insercoes.map(([, valores]) => valores[1])).toEqual([
        'Leite A', 'Leite B', 'Produto desconhecido'
    ]);
    expect(insercoes.map(([, valores]) => valores[7])).toEqual([7, 7, null]);
    expect(insercoes.every(([query]) => /ingrediente_id/.test(query))).toBe(true);
    expect(estoques).toHaveLength(3);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
});

test('adicionar itens a uma compra usa a mesma classificação transacional', async () => {
    const client = criarCliente();
    await adicionaItensACompraRepo({
        usuario_id: 1, compra_id: 42, valor_itens_novos: '8.00',
        itens: [item('Maçã'), item('Granola')]
    });

    const consultas = client.query.mock.calls;
    expect(consultas.find(([query]) => /FROM ingrediente/.test(query))[1]).toEqual([['maca']]);
    const insercoes = consultas.filter(([query]) => /INSERT INTO item/.test(query));
    expect(insercoes.map(([, valores]) => valores[7])).toEqual([9, null]);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
});

test('um ingrediente conhecido mas ausente do banco desfaz a compra', async () => {
    const client = criarCliente({});

    await expect(createCompraRepo({
        usuario_id: 1, valor_total: 4, estabelecimento: 'Mercado', itens: [item('Leite A')]
    })).rejects.toThrow('Ingrediente padrão ausente no banco: leite');

    expect(client.query.mock.calls.some(([query]) => /INSERT INTO item/.test(query))).toBe(false);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
});

test('uma compra só com itens desconhecidos não consulta o catálogo', async () => {
    const client = criarCliente();
    await createCompraRepo({
        usuario_id: 1, valor_total: 4, estabelecimento: 'Mercado', itens: [item('Granola')]
    });

    expect(client.query.mock.calls.some(([query]) => /FROM ingrediente/.test(query))).toBe(false);
    const insercao = client.query.mock.calls.find(([query]) => /INSERT INTO item/.test(query));
    expect(insercao[1][7]).toBeNull();
});

test('renomear um item conhecido atualiza nome e ingrediente na mesma transação', async () => {
    const client = criarCliente();
    const resultado = await atualizarPorCompraId(100, 42, { nome_item: 'Leite A' });
    const consultas = client.query.mock.calls;
    const busca = consultas.find(([query]) => /FROM ingrediente/.test(query));
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(busca[1]).toEqual([['leite']]);
    expect(atualizacao[0]).toMatch(/ingrediente_id = CASE WHEN \$9 THEN \$10 ELSE ingrediente_id END/);
    expect(atualizacao[1][3]).toBe('Leite A');
    expect(atualizacao[1].slice(-2)).toEqual([true, 7]);
    expect(resultado.item.ingrediente_id).toBe(7);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
});

test('renomear para nome desconhecido remove a classificação sem consultar ingrediente', async () => {
    const client = criarCliente();
    await atualizarPorCompraId(100, 42, { nome_item: 'Granola' });
    const consultas = client.query.mock.calls;
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(consultas.some(([query]) => /FROM ingrediente/.test(query))).toBe(false);
    expect(atualizacao[1].slice(-2)).toEqual([true, null]);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
});

test('edição sem renomeação preserva o ingrediente atual', async () => {
    const client = criarCliente();
    await atualizarPorCompraId(100, 42, { validade_estimada: null });
    const consultas = client.query.mock.calls;
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(consultas.some(([query]) => /FROM ingrediente/.test(query))).toBe(false);
    expect(atualizacao[1].slice(-2)).toEqual([false, null]);
    expect(atualizacao[0]).toMatch(/ELSE ingrediente_id END/);
});

test('ingrediente conhecido ausente no banco desfaz a renomeação individual', async () => {
    const client = criarCliente({});
    await expect(atualizarPorCompraId(100, 42, { nome_item: 'Leite A' }))
        .rejects.toThrow('Ingrediente padrão ausente no banco: leite');

    expect(client.query.mock.calls.some(([query]) => /UPDATE item/.test(query))).toBe(false);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
});

const itemBusca = {
    nome_item: 'Produto', quantidade: 1, unidade_de_medida: 'L',
    valor_unitario: 4, validade_estimada: null
};

test('renomeação coletiva resolve uma vez e aplica o mesmo ingrediente ao grupo', async () => {
    const client = criarCliente();
    await atualizarInstanciasPorCompraId(42, itemBusca, { nome_item: 'Leite B' });
    const consultas = client.query.mock.calls;
    const buscas = consultas.filter(([query]) => /FROM ingrediente/.test(query));
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(buscas).toHaveLength(1);
    expect(buscas[0][1]).toEqual([['leite']]);
    expect(atualizacao[1][1]).toBe('Leite B');
    expect(atualizacao[1].slice(-2)).toEqual([true, 7]);
    expect(atualizacao[1][10]).toEqual([100, 101]);
    expect(atualizacao[0]).toMatch(/ingrediente_id = CASE WHEN \$12 THEN \$13 ELSE ingrediente_id END/);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
});

test('renomeação coletiva desconhecida deixa as instâncias sem ingrediente', async () => {
    const client = criarCliente();
    await atualizarInstanciasPorCompraId(42, itemBusca, { nome_item: 'Granola' });
    const consultas = client.query.mock.calls;
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(consultas.some(([query]) => /FROM ingrediente/.test(query))).toBe(false);
    expect(atualizacao[1].slice(-2)).toEqual([true, null]);
    expect(consultas.at(-1)[0]).toBe('COMMIT');
});

test('edição coletiva sem renomeação preserva ingrediente e dispensa o catálogo', async () => {
    const client = criarCliente();
    await atualizarInstanciasPorCompraId(42, itemBusca, { validade_estimada: null });
    const consultas = client.query.mock.calls;
    const atualizacao = consultas.find(([query]) => /UPDATE item/.test(query));

    expect(consultas.some(([query]) => /FROM ingrediente/.test(query))).toBe(false);
    expect(atualizacao[1].slice(-2)).toEqual([false, null]);
    expect(atualizacao[0]).toMatch(/ELSE ingrediente_id END/);
});

test('ingrediente conhecido ausente no banco desfaz a renomeação coletiva', async () => {
    const client = criarCliente({});
    await expect(atualizarInstanciasPorCompraId(42, itemBusca, { nome_item: 'Leite A' }))
        .rejects.toThrow('Ingrediente padrão ausente no banco: leite');

    expect(client.query.mock.calls.some(([query]) => /UPDATE item/.test(query))).toBe(false);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
});
