jest.mock('../../Backend/src/repositories/estoqueRepository', () => ({
    buscarEstoque: jest.fn(), buscarDetalheEstoque: jest.fn(), atualizarQuantidade: jest.fn(),
    buscarValorEstoquePorUsuario: jest.fn(), buscarItensEstoquePorUsuario: jest.fn(), buscarConsumo: jest.fn()
}));

const repo = require('../../Backend/src/repositories/estoqueRepository');
const controller = require('../../Backend/src/controllers/estoqueController');

function resposta() {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    return res;
}

beforeEach(() => jest.resetAllMocks());
afterEach(() => jest.restoreAllMocks());

const leituras = [
    ['listarEstoque', 'buscarEstoque', [{ item_id: 12, quantidade_disponivel: '2.00', gasto: true }],
        'Erro ao buscar estoque no banco'],
    ['listarConsumo', 'buscarConsumo', [{ item_id: 12, quantidade_comprada: '5.00', valor_gasto: '6.00' }],
        'Erro ao buscar consumo no banco'],
    ['listarItensEstoque', 'buscarItensEstoquePorUsuario', [{ item_id: 12, valor_total_item: '4.00' }],
        'Erro ao buscar os itens do estoque.']
];

describe.each(leituras)('%s', (funcao, consulta, dados, mensagemErro) => {
    test.each([false, true])('retorna os dados do usuário, com estoque vazio: %s', async vazio => {
        const resultado = vazio ? [] : dados;
        repo[consulta].mockResolvedValue(resultado);
        const res = resposta();

        await controller[funcao]({ user: { id: 7 }, query: { usuario_id: 1 } }, res);

        expect(repo[consulta]).toHaveBeenCalledTimes(1);
        expect(repo[consulta]).toHaveBeenCalledWith(7);
        expect(res.json).toHaveBeenCalledWith(funcao === 'listarItensEstoque'
            ? { status: 'success', data: resultado } : resultado);
        expect(res.status).not.toHaveBeenCalledWith(500);
    });

    test('retorna erro público sem expor detalhes do banco', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        repo[consulta].mockRejectedValue(new Error('detalhe privado'));
        const res = resposta();

        await controller[funcao]({ user: { id: 7 } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith(funcao === 'listarItensEstoque'
            ? { message: mensagemErro } : { erro: mensagemErro });
    });
});

describe('listarGastosEstoque', () => {
    test.each(['0', '14.50'])('retorna o valor total %s sem converter o NUMERIC do banco', async total => {
        const gastos = { id: 7, username: 'teste', valor_total_estoque: total };
        repo.buscarValorEstoquePorUsuario.mockResolvedValue(gastos);
        const res = resposta();

        await controller.listarGastosEstoque({ user: { id: 7 } }, res);

        expect(repo.buscarValorEstoquePorUsuario).toHaveBeenCalledWith(7);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ status: 'success', data: gastos });
    });

    test('retorna 404 para usuário não encontrado', async () => {
        repo.buscarValorEstoquePorUsuario.mockResolvedValue(undefined);
        const res = resposta();
        await controller.listarGastosEstoque({ user: { id: 7 } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'Usuário não encontrado.' });
    });

    test('retorna 400 quando falta o identificador do usuário', async () => {
        const res = resposta();
        await controller.listarGastosEstoque({ user: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(repo.buscarValorEstoquePorUsuario).not.toHaveBeenCalled();
    });

    test('retorna 500 quando a consulta falha', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => {});
        repo.buscarValorEstoquePorUsuario.mockRejectedValue(new Error('detalhe privado'));
        const res = resposta();
        await controller.listarGastosEstoque({ user: { id: 7 } }, res);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Erro ao buscar o total de gastos do usuário.' });
    });
});

describe('atualizarQuantidadeItem — limites e falhas de gravação', () => {
    const executar = async (body, itemId = '12') => {
        const res = resposta();
        await controller.atualizarQuantidadeItem({ user: { id: 7 }, params: { itemId }, body }, res);
        return res;
    };

    test.each([undefined, null, {}, { quantidade: null }, { quantidade: true },
        { quantidade: NaN }, { quantidade: -Infinity }, { quantidade: 10000000 }])(
        'rejeita quantidade ausente ou inválida: %p', async body => {
            const res = await executar(body);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(repo.buscarDetalheEstoque).not.toHaveBeenCalled();
            expect(repo.atualizarQuantidade).not.toHaveBeenCalled();
        }
    );

    test.each(['-1', '9007199254740992'])('rejeita identificador inválido %s', async id => {
        const res = await executar({ quantidade: 1 }, id);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(repo.buscarDetalheEstoque).not.toHaveBeenCalled();
    });

    test.each([['unitaria', 0], ['variavel', 0], ['variavel', 0.01], ['variavel', 9999999.99]])(
        'aceita saldo %s de %s', async (tipo, quantidade) => {
            repo.buscarDetalheEstoque.mockResolvedValue({ tipo_medida: tipo, quantidade_original: '9999999.99' });
            const atualizado = { item_id: 12, quantidade_disponivel: String(quantidade) };
            repo.atualizarQuantidade.mockResolvedValue(atualizado);

            const res = await executar({ quantidade });

            expect(repo.atualizarQuantidade).toHaveBeenCalledWith(7, 12, quantidade);
            expect(res.json).toHaveBeenCalledWith(atualizado);
        }
    );

    test('retorna 500 quando a gravação falha após a consulta do detalhe', async () => {
        repo.buscarDetalheEstoque.mockResolvedValue({ tipo_medida: 'unitaria', quantidade_original: '5.00' });
        repo.atualizarQuantidade.mockRejectedValue(new Error('detalhe privado'));
        const res = await executar({ quantidade: 2 });
        expect(repo.atualizarQuantidade).toHaveBeenCalledWith(7, 12, 2);
        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ erro: 'Erro ao atualizar quantidade no estoque' });
    });
});
