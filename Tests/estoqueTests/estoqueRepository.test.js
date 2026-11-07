jest.mock('../../Backend/src/config/database', () => jest.fn());

const sql = require('../../Backend/src/config/database');
const repo = require('../../Backend/src/repositories/estoqueRepository');
const { buscarDetalheEstoque, atualizarQuantidade } = repo;

beforeEach(() => jest.resetAllMocks());

test('consulta o item apenas no estoque do usuário', async () => {
    const detalhe = { tipo_medida: 'unitaria', quantidade_original: '3.00' };
    sql.mockResolvedValue([detalhe]);
    await expect(buscarDetalheEstoque(7, 12)).resolves.toEqual(detalhe);
    const [partes, ...valores] = sql.mock.calls[0];
    expect(partes.join('?')).toContain('estoque.usuario_id = ? AND estoque.item_id = ?');
    expect(valores).toEqual([7, 12]);
});

test('atualização guarda limite, integralidade e pertencimento no mesmo comando SQL', async () => {
    sql.mockResolvedValue([{ item_id: 12, quantidade_disponivel: '2.00' }]);
    await atualizarQuantidade(7, 12, 2);
    const [partes, ...valores] = sql.mock.calls[0];
    const consulta = partes.join('?');
    expect(consulta).toContain('e.usuario_id = ?');
    expect(consulta).toContain('BETWEEN 0 AND i.quantidade');
    expect(consulta).toContain("i.tipo_medida = 'variavel' OR");
    expect(valores).toContain(7);
    expect(valores).toContain(12);
});

describe.each([
    ['buscarEstoque', 'estoque.usuario_id = ?', ['JOIN item', 'item.quantidade AS quantidade_original', 'estoque.gasto']],
    ['buscarItensEstoquePorUsuario', 'e.usuario_id = ?', ['ORDER BY i.nome_item', '(e.quantidade_disponivel * i.valor_unitario) AS valor_total_item']],
    ['buscarConsumo', 'estoque.usuario_id = ?', ['estoque.quantidade_disponivel < item.quantidade',
        '(item.quantidade - estoque.quantidade_disponivel) * item.valor_unitario AS valor_gasto']]
])('%s', (funcao, filtro, trechos) => {
    test.each([[[]], [[{ item_id: 12 }]]])('retorna as linhas do banco: %p', async linhas => {
        sql.mockResolvedValue(linhas);
        await expect(repo[funcao](7)).resolves.toEqual(linhas);
        expect(sql).toHaveBeenCalledTimes(1);
        const [partes, ...valores] = sql.mock.calls[0];
        const consulta = partes.join('?');
        expect(consulta).toContain(filtro);
        trechos.forEach(trecho => expect(consulta).toContain(trecho));
        expect(valores).toEqual([7]);
    });
});

describe('buscarValorEstoquePorUsuario', () => {
    test('soma o saldo valorizado e inclui usuário sem itens com total zero', async () => {
        const usuario = { id: 7, username: 'teste', valor_total_estoque: '0' };
        sql.mockResolvedValue([usuario]);
        await expect(repo.buscarValorEstoquePorUsuario(7)).resolves.toEqual(usuario);
        const [partes, ...valores] = sql.mock.calls[0];
        const consulta = partes.join('?');
        expect(consulta).toContain('COALESCE(SUM(e.quantidade_disponivel * i.valor_unitario), 0)');
        expect(consulta).toContain('LEFT JOIN estoque');
        expect(consulta).toContain('WHERE u.id = ?');
        expect(consulta).toContain('GROUP BY u.id, u.username');
        expect(valores).toEqual([7]);
    });

    test('retorna undefined para usuário inexistente', async () => {
        sql.mockResolvedValue([]);
        await expect(repo.buscarValorEstoquePorUsuario(7)).resolves.toBeUndefined();
    });
});

test('retorna undefined para item ausente no estoque consultado', async () => {
    sql.mockResolvedValue([]);
    await expect(buscarDetalheEstoque(7, 12)).resolves.toBeUndefined();
});

test('retorna o saldo persistido e parametriza todas as condições da atualização', async () => {
    const atualizado = { item_id: 12, quantidade_disponivel: '0.20' };
    sql.mockResolvedValue([atualizado]);
    await expect(atualizarQuantidade(7, 12, 0.2)).resolves.toEqual(atualizado);
    const [partes, ...valores] = sql.mock.calls[0];
    expect(partes.join('?')).toContain('e.item_id = ?');
    expect(partes.join('?')).toContain('RETURNING e.*');
    expect(valores).toEqual([0.2, 7, 12, 0.2, 0.2, 0.2]);
});

test('retorna undefined quando a atualização protegida não encontra saldo compatível', async () => {
    sql.mockResolvedValue([]);
    await expect(atualizarQuantidade(7, 12, 2)).resolves.toBeUndefined();
});

test.each([
    ['buscarEstoque', [7]], ['buscarDetalheEstoque', [7, 12]], ['atualizarQuantidade', [7, 12, 2]],
    ['buscarValorEstoquePorUsuario', [7]], ['buscarItensEstoquePorUsuario', [7]], ['buscarConsumo', [7]]
])('%s propaga falhas do banco para o controller', async (funcao, argumentos) => {
    const erro = new Error('Falha no banco');
    sql.mockRejectedValue(erro);
    await expect(repo[funcao](...argumentos)).rejects.toBe(erro);
});
