jest.mock('../../Backend/src/config/database.js', () => jest.fn());

const sql = require('../../Backend/src/config/database');
const { updateReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');

const payload = {
    nome: 'Pão integral',
    descricao: 'Descrição nova',
    modo_preparo: 'Misture e asse.'
};

beforeEach(() => jest.clearAllMocks());

describe('updateReceitaRepo', () => {
    test('atualiza os três campos no id indicado com valores parametrizados', async () => {
        const atualizada = { id: 7, ...payload };
        sql.mockResolvedValue([atualizada]);

        await expect(updateReceitaRepo(7, payload)).resolves.toEqual(atualizada);

        expect(sql).toHaveBeenCalledTimes(1);
        const [fragmentos, ...valores] = sql.mock.calls[0];
        expect(fragmentos.join('?')).toMatch(
            /UPDATE receita\s+SET\s+nome\s*=\s*\?\s*,\s*descricao\s*=\s*\?\s*,\s*modo_preparo\s*=\s*\?\s+WHERE id\s*=\s*\?/i
        );
        expect(valores).toEqual([
            payload.nome,
            payload.descricao,
            payload.modo_preparo,
            7
        ]);
    });

    test('retorna undefined quando nenhuma receita é encontrada', async () => {
        sql.mockResolvedValue([]);

        await expect(updateReceitaRepo(999, payload)).resolves.toBeUndefined();
    });
});
