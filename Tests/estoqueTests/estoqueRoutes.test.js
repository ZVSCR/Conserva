const request = require('supertest');

jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/repositories/estoqueRepository', () => ({
    buscarEstoque: jest.fn(), buscarDetalheEstoque: jest.fn(), atualizarQuantidade: jest.fn(),
    buscarValorEstoquePorUsuario: jest.fn(), buscarItensEstoquePorUsuario: jest.fn(), buscarConsumo: jest.fn()
}));

const repo = require('../../Backend/src/repositories/estoqueRepository');
const app = require('../../Backend/src/app');
const { createSessionToken, SESSION_COOKIE_NAME } = require('../../Backend/src/config/session');
const cookie = () => `${SESSION_COOKIE_NAME}=${createSessionToken(7)}`;

beforeEach(() => jest.resetAllMocks());

describe.each([
    ['/api/estoque', 'buscarEstoque', [{ item_id: 12, quantidade_disponivel: '2.00' }]],
    ['/api/estoque/consumo', 'buscarConsumo', [{ item_id: 12, valor_gasto: '6.00' }]],
    ['/api/estoque/itens', 'buscarItensEstoquePorUsuario', [{ item_id: 12, valor_total_item: '4.00' }]],
    ['/api/estoque/gastos', 'buscarValorEstoquePorUsuario', { id: 7, valor_total_estoque: '4.00' }]
])('GET %s com autenticação real', (rota, funcao, dados) => {
    test('retorna o contrato da rota usando a sessão apesar do usuario_id informado', async () => {
        repo[funcao].mockResolvedValue(dados);
        const res = await request(app).get(rota).set('Cookie', cookie()).query({ usuario_id: 1 });
        expect(res.status).toBe(200);
        expect(res.body).toEqual(['/api/estoque/itens', '/api/estoque/gastos'].includes(rota)
            ? { status: 'success', data: dados } : dados);
        expect(repo[funcao]).toHaveBeenCalledWith(7);
    });

    test.each([undefined, `${SESSION_COOKIE_NAME}=invalido`])('recusa cookie ausente ou inválido: %s', async token => {
        const req = request(app).get(rota).query({ usuario_id: 7 });
        if (token) req.set('Cookie', token);
        const res = await req;
        expect(res.status).toBe(401);
        expect(repo[funcao]).not.toHaveBeenCalled();
    });
});

test('PATCH usa a sessão e aceita zerar um lote', async () => {
    repo.buscarDetalheEstoque.mockResolvedValue({ quantidade_original: '5.00', tipo_medida: 'unitaria' });
    const atualizado = { item_id: 12, quantidade_disponivel: '0.00', gasto: true };
    repo.atualizarQuantidade.mockResolvedValue(atualizado);

    const res = await request(app).patch('/api/estoque/12').set('Cookie', cookie())
        .query({ usuario_id: 1 }).send({ quantidade: 0, usuario_id: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual(atualizado);
    expect(repo.buscarDetalheEstoque).toHaveBeenCalledWith(7, 12);
    expect(repo.atualizarQuantidade).toHaveBeenCalledWith(7, 12, 0);
});

test('PATCH não altera lote de outra conta', async () => {
    repo.buscarDetalheEstoque.mockResolvedValue(undefined);
    const res = await request(app).patch('/api/estoque/12').set('Cookie', cookie())
        .query({ usuario_id: 1 }).send({ quantidade: 2 });
    expect(res.status).toBe(404);
    expect(repo.buscarDetalheEstoque).toHaveBeenCalledWith(7, 12);
    expect(repo.atualizarQuantidade).not.toHaveBeenCalled();
});

test('PATCH exige cookie de sessão mesmo com usuario_id no corpo', async () => {
    const res = await request(app).patch('/api/estoque/12').send({ quantidade: 2, usuario_id: 7 });
    expect(res.status).toBe(401);
    expect(repo.buscarDetalheEstoque).not.toHaveBeenCalled();
    expect(repo.atualizarQuantidade).not.toHaveBeenCalled();
});
