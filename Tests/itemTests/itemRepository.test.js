jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    atualizarPorCompraId: jest.fn()
}));

const sql = require('../../Backend/src/config/database');
const { atualizarPorCompraId } = require('../../Backend/src/repositories/compraRepository');
const { atualizarPorId, apagarPorId } = require('../../Backend/src/repositories/itemRepository');

beforeEach(() => jest.clearAllMocks());

test('edição direta reutiliza a atualização transacional da compra', async () => {
    sql.mockResolvedValue([{ compra_id: 42 }]);
    atualizarPorCompraId.mockResolvedValue({ item: { id: 10, nome_item: 'Produto' } });

    await expect(atualizarPorId(10, { nome_item: 'Produto' }))
        .resolves.toEqual({ id: 10, nome_item: 'Produto' });
    expect(atualizarPorCompraId).toHaveBeenCalledWith(10, 42, { nome_item: 'Produto' });
});

test('não tenta atualizar item inexistente', async () => {
    sql.mockResolvedValue([]);
    await expect(atualizarPorId(10, { quantidade: 2 })).resolves.toBeUndefined();
    expect(atualizarPorCompraId).not.toHaveBeenCalled();
});

test('remoção recompõe o total sem incluir o item apagado', async () => {
    sql.mockResolvedValue([{ id: 10 }]);
    await expect(apagarPorId(10)).resolves.toEqual({ id: 10 });
    const [partes] = sql.mock.calls[0];
    expect(partes.join('?')).toContain('i.id <> ?');
});
