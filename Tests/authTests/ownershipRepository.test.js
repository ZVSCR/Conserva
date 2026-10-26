jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
const sql = require('../../Backend/src/config/database');
const pool = require('../../Backend/src/config/transactionDatabase');
const items = require('../../Backend/src/repositories/itemRepository');
const recipes = require('../../Backend/src/repositories/receitaRepository');

beforeEach(() => { jest.resetAllMocks(); sql.mockResolvedValue([]); });

test('consulta e exclusão direta de item incluem o proprietário na mesma instrução SQL', async () => {
    await items.buscarPorId(70, 7);
    expect(sql.mock.calls[0][0].join('?')).toMatch(/c.usuario_id = \?/);
    expect(sql.mock.calls[0].slice(1)).toEqual([70, 7]);
    await items.apagarPorId(70, 7);
    expect(sql.mock.calls[1][0].join('?')).toMatch(/DELETE FROM item i USING compra c/);
    expect(sql.mock.calls[1].slice(1)).toContain(7);
});

test('listagem geral de itens é limitada à conta conectada', async () => {
    await items.buscarItens(42);
    expect(sql.mock.calls[0][0].join('?')).toContain('WHERE users.id = ?');
    expect(sql.mock.calls[0].slice(1)).toEqual([42]);
});

test('edição de receita exige proprietário e consulta aceita própria ou pública', async () => {
    await recipes.getReceitaByIdRepo(70, 7);
    expect(sql.mock.calls[0][0].join('?')).toContain('(r.usuario_id IS NULL OR r.usuario_id = ?)');
    await recipes.updateReceitaRepo(70, { nome: 'A', descricao: 'B', modo_preparo: 'C' }, 7);
    expect(sql.mock.calls[1][0].join('?')).toContain('AND usuario_id = ?');
    expect(sql.mock.calls[1].slice(1)).toEqual(['A', 'B', 'C', 70, 7]);
});

test('preparar receita privada de outra conta falha antes de consumir estoque', async () => {
    const client = { query: jest.fn().mockResolvedValue({ rows: [] }), release: jest.fn() };
    pool.connect.mockResolvedValue(client);
    await expect(recipes.prepararReceitaRepo(7, 420, jest.fn())).rejects.toBeInstanceOf(recipes.ReceitaNaoEncontradaError);
    expect(client.query.mock.calls[1]).toEqual([
        'SELECT id FROM receita WHERE id = $1 AND (usuario_id IS NULL OR usuario_id = $2)', [420, 7]
    ]);
    expect(client.query.mock.calls.some(([query]) => query.includes('UPDATE estoque'))).toBe(false);
});

test('histórico de refeições só consulta preparos da conta conectada', async () => {
    await recipes.listarPreparosPorUsuario(42);
    expect(sql.mock.calls[0][0].join('?')).toContain('WHERE rp.usuario_id = ?');
    expect(sql.mock.calls[0].slice(1)).toEqual([42]);
});
