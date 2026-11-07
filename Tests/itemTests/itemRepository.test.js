jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    atualizarPorCompraId: jest.fn()
}));

const sql = require('../../Backend/src/config/database');
const pool = require('../../Backend/src/config/transactionDatabase');
const { atualizarPorCompraId } = require('../../Backend/src/repositories/compraRepository');
const { atualizarPorId, apagarPorId } = require('../../Backend/src/repositories/itemRepository');

beforeEach(() => jest.clearAllMocks());

test('edição direta reutiliza a atualização transacional da compra', async () => {
    sql.mockResolvedValue([{ compra_id: 42, usuario_id: 7 }]);
    atualizarPorCompraId.mockResolvedValue({ item: { id: 10, nome_item: 'Produto' } });

    await expect(atualizarPorId(10, { nome_item: 'Produto' }, 7))
        .resolves.toEqual({ id: 10, nome_item: 'Produto' });
    expect(atualizarPorCompraId).toHaveBeenCalledWith(7, 10, 42, { nome_item: 'Produto' });
});

test('não tenta atualizar item inexistente', async () => {
    sql.mockResolvedValue([]);
    await expect(atualizarPorId(10, { quantidade: 2 }, 7)).resolves.toBeUndefined();
    expect(atualizarPorCompraId).not.toHaveBeenCalled();
});

test('remoção recompõe o total sem incluir o item apagado', async () => {
    const client = {
        query: jest.fn(async query => {
            if (query.includes('SELECT i.compra_id')) return { rows: [{ compra_id: 42 }] };
            if (query.includes('DELETE FROM item')) return { rows: [{ id: 10 }] };
            return { rows: [] };
        }),
        release: jest.fn()
    };
    pool.connect.mockResolvedValue(client);
    await expect(apagarPorId(10, 7)).resolves.toEqual({ id: 10 });
    expect(client.query.mock.calls[1][0]).toContain('FOR UPDATE OF c');
    expect(client.query.mock.calls[2][0]).toContain('DELETE FROM item');
    expect(client.query.mock.calls[3][0]).toMatch(/SUM\(ROUND\(i\.quantidade \* i\.valor_unitario, 2\)\)/);
    expect(client.query.mock.calls[3][1]).toEqual([42]);
    expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');
    expect(client.release).toHaveBeenCalledTimes(1);
});

test('falha ao recompor o total desfaz a exclusão', async () => {
    const falha = new Error('Falha ao atualizar compra');
    const client = {
        query: jest.fn(async query => {
            if (query.includes('SELECT i.compra_id')) return { rows: [{ compra_id: 42 }] };
            if (query.includes('UPDATE compra')) throw falha;
            return { rows: [{ id: 10 }] };
        }),
        release: jest.fn()
    };
    pool.connect.mockResolvedValue(client);
    await expect(apagarPorId(10, 7)).rejects.toBe(falha);
    expect(client.query.mock.calls.at(-1)[0]).toBe('ROLLBACK');
    expect(client.release).toHaveBeenCalledTimes(1);
});
