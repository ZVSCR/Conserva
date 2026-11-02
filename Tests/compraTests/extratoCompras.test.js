jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    listarExtratoUsuario: jest.fn(),
    listarComprasUsuario: jest.fn()
}));
const { listarExtratoUsuario, listarComprasUsuario } = require('../../Backend/src/repositories/compraRepository');
const { listarCompras } = require('../../Backend/src/controllers/compraController');

test('retorna o total armazenado e compras do usuario autenticado no resumo', async () => {
    const compras = [{ id: 2, valor_total: '12.30', quantidade_itens: 2 }];
    listarExtratoUsuario.mockResolvedValue({ gasto_total: '12.30', compras });
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await listarCompras({ compraUsuarioId: 7, query: { resumo: 'true', usuario_id: '1' } }, res);
    expect(listarExtratoUsuario).toHaveBeenCalledWith(7);
    expect(listarComprasUsuario).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ status: 'success', data: compras, gasto_total: '12.30' });
});
