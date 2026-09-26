jest.mock('../../Backend/src/config/database.js', () => {
    const sql = jest.fn();
    sql.transaction = jest.fn();
    return sql;
});

const expectCookies = require('supertest/lib/cookies');
const sql = require('../../Backend/src/config/database');
const {
    listarComprasUsuario,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError
} = require('../../Backend/src/repositories/compraRepository');

const transactionSql = (strings, ...values) => ({ strings, values });

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
        const [, ...parametros] = sql.mock.calls[0];
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
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('lança ItemCompraNaoEncontradoError quando nenhum item é atualizado', async () => {
        sql.transaction.mockImplementation(async (buildQueries) => {
            const queries = buildQueries(transactionSql);
            expect(queries).toHaveLength(2);
            return [[], []];
        });

        await expect(
            atualizarPorCompraId(99, 2, { quantidade: 1 })
        ).rejects.toBeInstanceOf(ItemCompraNaoEncontradoError);
    });

    test('retorna o item e a compra produzidos pela transação', async () => {
        const item = { id: 1, quantidade: '2.00' };
        const compra = { id: 2, valor_total: '20.00' };

        sql.transaction.mockImplementation(async (buildQueries) => {
            const queries = buildQueries(transactionSql);
            expect(queries).toHaveLength(2);
            return [[item], [compra]];
        });

        await expect(
            atualizarPorCompraId(1, 2, { quantidade: 2 })
        ).resolves.toEqual({ item, compra });
    });
});
