jest.mock('../../Backend/src/repositories/estoqueRepository', () => ({
    buscarEstoque: jest.fn(),
    buscarDetalheEstoque: jest.fn(),
    atualizarQuantidade: jest.fn(),
    buscarValorEstoquePorUsuario: jest.fn(),
    buscarItensEstoquePorUsuario: jest.fn(),
    buscarConsumo: jest.fn()
}));

const { buscarDetalheEstoque, atualizarQuantidade } = require('../../Backend/src/repositories/estoqueRepository');
const { atualizarQuantidadeItem } = require('../../Backend/src/controllers/estoqueController');

function resposta() {
    const res = { status: jest.fn(), json: jest.fn() };
    res.status.mockReturnValue(res);
    return res;
}

const requisicao = quantidade => ({
    user: { id: 7 }, params: { itemId: '12' }, body: { quantidade }
});

beforeEach(() => {
    jest.clearAllMocks();
    atualizarQuantidade.mockResolvedValue({ item_id: 12, quantidade_disponivel: 2 });
});

test('aceita saldo inteiro de lote unitário e usa o usuário da rota', async () => {
    buscarDetalheEstoque.mockResolvedValue({ tipo_medida: 'unitaria', quantidade_original: '3.00' });
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(2), res);
    expect(buscarDetalheEstoque).toHaveBeenCalledWith(7, 12);
    expect(atualizarQuantidade).toHaveBeenCalledWith(7, 12, 2);
    expect(res.json).toHaveBeenCalledWith({ item_id: 12, quantidade_disponivel: 2 });
});

test.each([1.5, 4])('rejeita saldo unitário inválido %p', async quantidade => {
    buscarDetalheEstoque.mockResolvedValue({ tipo_medida: 'unitaria', quantidade_original: '3.00' });
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(quantidade), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(atualizarQuantidade).not.toHaveBeenCalled();
});

test('aceita consumo fracionário de uma embalagem variável', async () => {
    buscarDetalheEstoque.mockResolvedValue({ tipo_medida: 'variavel', quantidade_original: '0.50' });
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(0.2), res);
    expect(atualizarQuantidade).toHaveBeenCalledWith(7, 12, 0.2);
});

test('não atualiza item fora do estoque do usuário', async () => {
    buscarDetalheEstoque.mockResolvedValue(undefined);
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(1), res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(atualizarQuantidade).not.toHaveBeenCalled();
});

test('rejeita números não finitos antes de acessar o banco', async () => {
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(Infinity), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(buscarDetalheEstoque).not.toHaveBeenCalled();
});

test('rejeita saldo que seria arredondado pelo banco', async () => {
    const res = resposta();
    await atualizarQuantidadeItem(requisicao(0.001), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(buscarDetalheEstoque).not.toHaveBeenCalled();
});
