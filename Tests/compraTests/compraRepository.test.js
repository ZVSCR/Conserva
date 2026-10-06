jest.mock('../../Backend/src/config/database.js', () => {
    const sql = jest.fn();
    sql.transaction = jest.fn();
    return sql;
});
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const sql = require('../../Backend/src/config/database');
const pool = require('../../Backend/src/config/transactionDatabase');
const {
    listarComprasUsuario,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    atualizarInstanciasPorCompraId,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError,
    GranularidadeInvalidaError,
    ItemCompraConflitoError
} = require('../../Backend/src/repositories/compraRepository');

describe('compraRepository.listarComprasUsuario', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('falha na consulta propaga erro do bancoh', async () => {
        const erro = new Error('Falha de conexão');
        sql.mockRejectedValue(erro);

        await expect(
            listarComprasUsuario(1)
        ).rejects.toBe(erro);
        expect(sql).toHaveBeenCalledTimes(1);
    });

    test('banco não retorna nada para lista vazia', async () => {
        sql.mockResolvedValue([]);
        await expect(
            listarComprasUsuario(1)
        ).resolves.toEqual([]);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0].slice(1)).toEqual([1]);
    });

    test('banco retorna compras corretas', async () => {
        const linhas = [
            { id: 2, item_id: 10, nome_item: 'Arroz' },
            { id: 2, item_id: 11, nome_item: 'Feijão' },
            { id: 4, item_id: 12, nome_item: 'Leite' }
        ];
        sql.mockResolvedValue(linhas);

        await expect(
            listarComprasUsuario(1)
        ).resolves.toEqual(linhas);
        expect(sql).toHaveBeenCalledTimes(1);
        // verifica se os parametros corretos foram enviados na chamada
        expect(sql.mock.calls[0].slice(1)).toEqual([1]);
    });
});

describe('compraRepository.listarCompraPorId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('falha na consulta propaga erro do banco', async () => {
        const erro = new Error('Erro ao buscar itens da compra');
        sql.mockRejectedValue(erro);

        await expect(
            listarCompraPorId(1, 2)
        ).rejects.toBe(erro);
        expect(sql).toHaveBeenCalledTimes(1);
    });

    test('banco lança CompraNaoEncontradaError para compra inexistente', async () => {
        sql.mockResolvedValue([]);

        await expect(
            listarCompraPorId(1, 99)
        ).rejects.toBeInstanceOf(CompraNaoEncontradaError);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0].slice(1)).toEqual([1, 99]);
    });

    test('banco retorna compra correta', async () => {
        const linhas = [
            { id: 2, item_id: 10, nome_item: 'Arroz' },
            { id: 2, item_id: 11, nome_item: 'Feijão' }
        ];
        sql.mockResolvedValue(linhas);

        await expect(
            listarCompraPorId(1, 2)
        ).resolves.toEqual(linhas);
        expect(sql).toHaveBeenCalledTimes(1);
        expect(sql.mock.calls[0].slice(1)).toEqual([1, 2]);
    });
});

describe('compraRepository.atualizarCompraPorId', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('lança CompraNaoEncontradaError quando a compra não existe', async () => {
        sql.mockResolvedValue([]);

        await expect(
            atualizarCompraPorId(99, {
                estabelecimento: 'Mercado Central'
            })
        ).rejects.toBeInstanceOf(CompraNaoEncontradaError);
    });

    test('retorna a compra atualizada', async () => {
        const compra = {
            id: 2,
            data_compra: '2026-09-19T14:30:00.000Z',
            estabelecimento: 'Mercado Central'
        };
        sql.mockResolvedValue([compra]);

        await expect(
            atualizarCompraPorId(2, {
                data_compra: '2026-09-19T14:30:00.000Z',
                estabelecimento: 'Mercado Central'
            })
        ).resolves.toEqual(compra);
    });
});

describe('compraRepository.atualizarPorCompraId', () => {
    function prepararCliente(atual) {
        const item = { id: 1, quantidade: '3.00', tipo_medida: 'unitaria' };
        const compra = { id: 2, valor_total: '6.00' };
        const estoque = { id: 10, quantidade_disponivel: '3.00' };
        const client = {
            query: jest.fn(async (query) => {
                if (query.includes('SELECT i.*')) return { rows: atual ? [atual] : [] };
                if (query.includes('UPDATE item')) return { rows: [item] };
                if (query.includes('UPDATE estoque')) return { rows: [estoque] };
                if (query.includes('UPDATE compra')) return { rows: [compra] };
                return { rows: [] };
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(client);
        return { client, item, compra, estoque };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('lança ItemCompraNaoEncontradoError quando nenhum item é atualizado', async () => {
        const { client } = prepararCliente(null);

        await expect(
            atualizarPorCompraId(99, 2, { quantidade: 1 })
        ).rejects.toBeInstanceOf(ItemCompraNaoEncontradoError);
        expect(client.query.mock.calls.map(([query]) => query)).toContain('ROLLBACK');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('corrige lote ainda não consumido e mantém item, estoque e compra juntos', async () => {
        const { client, item, compra, estoque } = prepararCliente({
            id: 1, quantidade: '2.00', quantidade_disponivel: '2.00',
            estoque_id: 10, tipo_medida: 'unitaria', unidade_de_medida: 'un'
        });

        await expect(
            atualizarPorCompraId(1, 2, { quantidade: 3 })
        ).resolves.toEqual({ item, compra, estoque });
        expect(client.query.mock.calls.some(([query, values]) =>
            query.includes('UPDATE estoque') && values[0] === 3
        )).toBe(true);
        expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
    });

    test('não reescreve a quantidade original depois de consumo', async () => {
        const { client } = prepararCliente({
            id: 1, quantidade: '3.00', quantidade_disponivel: '2.00',
            estoque_id: 10, tipo_medida: 'unitaria', unidade_de_medida: 'un'
        });
        await expect(atualizarPorCompraId(1, 2, { quantidade: 4 }))
            .rejects.toBeInstanceOf(ItemCompraConflitoError);
        expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE item'))).toBe(false);
    });

    test('rejeita fração para lote unitário', async () => {
        prepararCliente({
            id: 1, quantidade: '3.00', quantidade_disponivel: '3.00',
            estoque_id: 10, tipo_medida: 'unitaria', unidade_de_medida: 'un'
        });
        await expect(atualizarPorCompraId(1, 2, { quantidade: 1.5 }))
            .rejects.toBeInstanceOf(GranularidadeInvalidaError);
    });

    test('exige quantidade e preço ao trocar a unidade de um item variável', async () => {
        prepararCliente({
            id: 1, quantidade: '0.50', quantidade_disponivel: '0.50',
            estoque_id: 10, tipo_medida: 'variavel', unidade_de_medida: 'kg'
        });
        await expect(atualizarPorCompraId(1, 2, { unidade_de_medida: 'g' }))
            .rejects.toBeInstanceOf(GranularidadeInvalidaError);
    });
});

describe('compraRepository.atualizarInstanciasPorCompraId', () => {
    const itemBusca = {
        nome_item: 'Produto',
        quantidade: 0.5,
        unidade_de_medida: 'kg',
        valor_unitario: 20,
        validade_estimada: null
    };

    function prepararTransacao(itens) {
        const compra = [{ id: 2, valor_total: '18.00' }];
        const client = {
            query: jest.fn(async (query) => {
                if (query.includes('UPDATE item')) return { rows: itens };
                if (query.includes('UPDATE compra')) return { rows: compra };
                return { rows: [] };
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(client);
        return { client, compra };
    }

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test.each([
        { quantidade: 1 },
        { unidade_de_medida: 'g' },
        { tipo_medida: 'unitaria' }
    ])('rejeita alteração coletiva da granularidade no repositório', async (updates) => {
        await expect(atualizarInstanciasPorCompraId(2, itemBusca, updates))
            .rejects.toBeInstanceOf(GranularidadeInvalidaError);
        expect(pool.connect).not.toHaveBeenCalled();
    });

    test('atualiza metadados de duas embalagens sem tocar em quantidade ou estoque', async () => {
        const itens = [
            { id: 1, quantidade: '0.50', valor_unitario: '18.00' },
            { id: 2, quantidade: '0.50', valor_unitario: '18.00' }
        ];
        const { client, compra } = prepararTransacao(itens);

        await expect(atualizarInstanciasPorCompraId(2, itemBusca, {
            nome_item: 'Outro', valor_unitario: 18
        })).resolves.toEqual({ itens, compra: compra[0] });

        const consultas = client.query.mock.calls;
        expect(consultas).toHaveLength(4);
        const setClause = consultas[1][0].split('SET')[1].split('WHERE')[0];
        expect(setClause).not.toMatch(/\bquantidade\s*=/i);
        expect(setClause).not.toMatch(/\bunidade_de_medida\s*=/i);
        expect(consultas.map(([query]) => query).join(' ')).not.toMatch(/\bestoque\b/i);
        expect(consultas[1][1]).toContain('kg');
        expect(consultas[1][1]).toContain(false);
        expect(consultas[2][0]).toMatch(/SUM\(quantidade \* valor_unitario\)/);
        expect(consultas[3][0]).toBe('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('permite remover validade explicitamente sem perder esse sinal', async () => {
        const { client } = prepararTransacao([{ id: 1 }]);
        await atualizarInstanciasPorCompraId(2, itemBusca, { validade_estimada: null });
        expect(client.query.mock.calls[1][1]).toContain(true);
    });

    test('retorna não encontrado quando o seletor não corresponde a itens', async () => {
        const { client } = prepararTransacao([]);
        await expect(atualizarInstanciasPorCompraId(2, itemBusca, { nome_item: 'Outro' }))
            .rejects.toBeInstanceOf(ItemCompraNaoEncontradoError);
        expect(client.query.mock.calls.map(([query]) => query)).toEqual([
            'BEGIN', expect.stringContaining('UPDATE item'), 'ROLLBACK'
        ]);
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});
