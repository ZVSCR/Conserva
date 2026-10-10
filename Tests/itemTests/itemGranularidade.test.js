jest.mock('../../Backend/src/repositories/itemRepository', () => ({
    buscarItens: jest.fn(), buscarPorId: jest.fn(), atualizarPorId: jest.fn(),
    apagarPorId: jest.fn(), buscarItensPorUsuario: jest.fn()
}));
jest.mock('../../Backend/src/services/compraService', () => ({
    adicionaItensACompraService: jest.fn()
}));
jest.mock('../../Backend/src/repositories/compraRepository', () => ({
    GranularidadeInvalidaError: class extends Error {},
    ItemCompraConflitoError: class extends Error {},
    ItemCompraNaoEncontradoError: class extends Error {}
}));

const { atualizarPorId } = require('../../Backend/src/repositories/itemRepository');
const { adicionaItensACompraService } = require('../../Backend/src/services/compraService');
const { criarItemHandler, atualizarItem } = require('../../Backend/src/controllers/itemController');

function resposta() {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
}

beforeEach(() => {
    jest.clearAllMocks();
    adicionaItensACompraService.mockResolvedValue({ id: 42 });
    atualizarPorId.mockResolvedValue({ id: 10, nome_item: 'Novo nome' });
});

test('criação direta usa o serviço compartilhado de compras', async () => {
    const body = {
        usuario_id: 7, compra_id: 42, nome_item: 'Produto', quantidade: 0.5,
        unidade_de_medida: 'kg', tipo_medida: 'variavel', numero_embalagens: 2,
        valor_unitario: 20
    };
    const res = resposta();
    await criarItemHandler({ body }, res);
    expect(adicionaItensACompraService).toHaveBeenCalledWith(7, 42, { itens: [body] });
    expect(res.status).toHaveBeenCalledWith(201);
});

test('criação direta exige uma compra de destino', async () => {
    const res = resposta();
    await criarItemHandler({ body: { usuario_id: 7 } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(adicionaItensACompraService).not.toHaveBeenCalled();
});

test('criação direta rejeita fração de item unitário', async () => {
    const body = {
        usuario_id: 7, compra_id: 42, nome_item: 'Produto', quantidade: 1.5,
        unidade_de_medida: 'un', tipo_medida: 'unitaria', valor_unitario: 2
    };
    const res = resposta();
    await criarItemHandler({ body }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(adicionaItensACompraService).not.toHaveBeenCalled();
});

test('edição direta preserva a rota de nome e usa atualização compartilhada', async () => {
    const res = resposta();
    await atualizarItem({ params: { id: '10' }, body: { nome_item: 'Novo nome' } }, res);
    expect(atualizarPorId).toHaveBeenCalledWith(10, expect.objectContaining({ nome_item: 'Novo nome' }));
    expect(res.status).toHaveBeenCalledWith(200);
});

test('edição direta não permite alterar a classificação de um item existente', async () => {
    const res = resposta();
    await atualizarItem({ params: { id: '10' }, body: { tipo_medida: 'unitaria' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(atualizarPorId).not.toHaveBeenCalled();
});
