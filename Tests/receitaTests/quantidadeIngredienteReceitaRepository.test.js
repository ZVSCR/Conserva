jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
const sql = require('../../Backend/src/config/database');
const { atualizarQuantidadeIngredienteReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');

beforeEach(() => jest.resetAllMocks());

test.each([1, 7])('altera apenas a quantidade com autorização atômica para a sessão %s', async (usuarioId) => {
    const vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '2.50', unidade_de_medida: 'kg' };
    sql.mockResolvedValue([vinculo]);
    await expect(atualizarQuantidadeIngredienteReceitaRepo(9, 88, 2.5, usuarioId)).resolves.toEqual(vinculo);
    expect(sql).toHaveBeenCalledTimes(1);
    const [parts, ...values] = sql.mock.calls[0];
    const query = parts.join('?').replace(/\s+/g, ' ');
    expect(query).toContain('UPDATE receita_ingrediente ri SET quantidade = ? FROM receita r');
    expect(query).toContain('ri.receita_id = r.id AND ri.receita_id = ? AND ri.ingrediente_id = ?');
    expect(query).toContain('(r.usuario_id = ? OR (r.usuario_id IS NULL AND ? = 1))');
    expect(values).toEqual([2.5, 9, 88, usuarioId, usuarioId]);
});

test('retorna undefined sem vínculo autorizado', async () => {
    sql.mockResolvedValue([]);
    await expect(atualizarQuantidadeIngredienteReceitaRepo(9, 88, 2.5, 7)).resolves.toBeUndefined();
});
