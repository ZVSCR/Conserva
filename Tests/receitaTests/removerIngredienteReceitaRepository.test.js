jest.mock('../../Backend/src/config/database', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));

const sql = require('../../Backend/src/config/database');
const { removerIngredienteReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');

beforeEach(() => jest.resetAllMocks());

test('exclui somente o vínculo específico e restringe a operação ao dono da receita', async () => {
    const vinculo = { receita_id: 9, ingrediente_id: 88, quantidade: '1.25', unidade_de_medida: 'kg' };
    sql.mockResolvedValue([vinculo]);
    await expect(removerIngredienteReceitaRepo(9, 88, 7)).resolves.toEqual(vinculo);

    expect(sql).toHaveBeenCalledTimes(1);
    const [parts, ...values] = sql.mock.calls[0];
    const query = parts.join('?').replace(/\s+/g, ' ');
    expect(query).toContain('DELETE FROM receita_ingrediente ri USING receita r');
    expect(query).toContain('ri.receita_id = r.id');
    expect(query).toContain('ri.receita_id = ?');
    expect(query).toContain('ri.ingrediente_id = ?');
    expect(query).toContain('r.usuario_id = ?');
    expect(values).toEqual([9, 88, 7]);
});

test('retorna undefined quando o vínculo não existe ou a receita não pertence ao usuário', async () => {
    sql.mockResolvedValue([]);
    await expect(removerIngredienteReceitaRepo(9, 88, 7)).resolves.toBeUndefined();
});

test('propaga falhas do banco para o controlador', async () => {
    const error = new Error('falha do banco');
    sql.mockRejectedValue(error);
    await expect(removerIngredienteReceitaRepo(9, 88, 7)).rejects.toBe(error);
});
