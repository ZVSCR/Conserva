jest.mock('../../Backend/src/config/database.js', () => {
    const sql = jest.fn();
    sql.transaction = jest.fn();
    return sql;
});

const sql = require('../../Backend/src/config/database');
const {
    atualizarPorCompraId,
    ItemCompraNaoEncontradoError
} = require('../../Backend/src/repositories/compraRepository');

const transactionSql = (strings, ...values) => ({ strings, values });

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
