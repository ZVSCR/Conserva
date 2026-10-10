// Assume que o repositório usa o sql da Neon como tagged template:
// sql`INSERT ... VALUES (${nome}, ${descricao}, ${modo_preparo}) ...`
// Se você usar sql.query(texto, params), ajuste as asserções sobre os parâmetros.
jest.mock('../../Backend/src/config/database.js', () => jest.fn());

const sql = require('../../Backend/src/config/database');
const {
    createReceitaRepo
} = require('../../Backend/src/repositories/receitaRepository');

const payload = {
    nome: 'Bolo de Fubá',
    descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
    modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.'
};

describe('receitaRepository.createReceitaRepo', () => {
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        // O repositório registra o erro antes de relançá-lo; silencia o log nos testes.
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test('retorna o id da receita criada', async () => {
        sql.mockResolvedValue([{ id: 7 }]);

        await expect(createReceitaRepo(payload)).resolves.toEqual({ id: 7 });
        expect(sql).toHaveBeenCalledTimes(1);
    });

    test('envia nome, descrição e modo de preparo como parâmetros, na ordem do INSERT', async () => {
        sql.mockResolvedValue([{ id: 7 }]);

        await createReceitaRepo(payload);

        // No tagged template, os valores interpolados chegam após o array de strings.
        expect(sql.mock.calls[0].slice(1)).toEqual([
            payload.nome,
            payload.descricao,
            payload.modo_preparo
        ]);
        expect(sql.mock.calls[0][0].join('?')).toMatch(/INSERT INTO receita/i);
    });

    test('lança erro quando o banco não retorna nenhum registro', async () => {
        sql.mockResolvedValue([]);

        await expect(createReceitaRepo(payload))
            .rejects.toThrow('Falha ao criar receita');
    });

    test('propaga o erro do banco', async () => {
        const erro = new Error('Falha de conexão');
        sql.mockRejectedValue(erro);

        await expect(createReceitaRepo(payload)).rejects.toBe(erro);
        expect(sql).toHaveBeenCalledTimes(1);
    });
});