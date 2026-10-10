jest.mock('../../Backend/src/config/database', () => jest.fn());

const sql = require('../../Backend/src/config/database');
const { buscarDetalheEstoque, atualizarQuantidade } = require('../../Backend/src/repositories/estoqueRepository');

beforeEach(() => jest.clearAllMocks());

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
