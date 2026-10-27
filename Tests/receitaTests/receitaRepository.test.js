jest.mock('../../Backend/src/config/database.js', () => jest.fn());
jest.mock('../../Backend/src/config/transactionDatabase.js', () => ({
    connect: jest.fn()
}));

const pool = require('../../Backend/src/config/transactionDatabase');
const { createReceitaRepo } = require('../../Backend/src/repositories/receitaRepository');

const payload = {
    usuario_id: 7,
    nome: 'Bolo de Fubá',
    descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
    modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.',
    ingredientes: [
        { nome: 'fuba', quantidade: 13, unidade_de_medida: 'kg' },
        { nome: 'bolo', quantidade: 22, unidade_de_medida: 'un' }
    ]
};

describe('receitaRepository.createReceitaRepo', () => {
    let client;
    let ingredientesNoBanco;
    let proximoIngredienteId;
    let consoleSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        ingredientesNoBanco = new Map();
        proximoIngredienteId = 100;
        client = {
            query: jest.fn(async (consulta, valores = []) => {
                if (consulta === 'BEGIN' || consulta === 'COMMIT' || consulta === 'ROLLBACK') {
                    return { rows: [] };
                }

                if (consulta.includes('INSERT INTO receita (')) {
                    return { rows: [{ id: 42 }] };
                }

                if (consulta.includes('SELECT id') && consulta.includes('FROM ingrediente')) {
                    const ingrediente = ingredientesNoBanco.get(valores[0]);
                    return { rows: ingrediente ? [{ id: ingrediente.id }] : [] };
                }

                if (consulta.includes('INSERT INTO ingrediente')) {
                    const [nome] = valores;
                    if (ingredientesNoBanco.has(nome)) return { rows: [] };

                    const ingrediente = { id: proximoIngredienteId++ };
                    ingredientesNoBanco.set(nome, ingrediente);
                    return { rows: [{ id: ingrediente.id }] };
                }

                if (consulta.includes('INSERT INTO receita_ingrediente')) {
                    return { rows: [] };
                }

                throw new Error(`Consulta inesperada: ${consulta}`);
            }),
            release: jest.fn()
        };
        pool.connect.mockResolvedValue(client);
        consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    test('cria receita e associa ingredientes na mesma transação', async () => {
        await expect(createReceitaRepo(payload)).resolves.toEqual({ id: 42 });

        expect(client.query.mock.calls[0][0]).toBe('BEGIN');
        expect(client.query.mock.calls.at(-1)[0]).toBe('COMMIT');

        const insertReceita = client.query.mock.calls.find(([query]) => query.includes('INSERT INTO receita ('));
        expect(insertReceita[1]).toEqual([
            payload.usuario_id,
            payload.nome,
            payload.descricao,
            payload.modo_preparo
        ]);

        const associacoes = client.query.mock.calls.filter(([query]) => query.includes('INSERT INTO receita_ingrediente'));
        expect(associacoes).toHaveLength(2);
        expect(associacoes.map(([, valores]) => valores.slice(0, 1))).toEqual([[42], [42]]);
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('usa ingrediente existente e ignora aparições repetidas após normalização', async () => {
        ingredientesNoBanco.set('fuba', { id: 88 });
        const payloadComDuplicata = {
            ...payload,
            ingredientes: [
                { nome: 'Fubá', quantidade: 13, unidade_de_medida: 'kg' },
                { nome: 'fuba', quantidade: 2, unidade_de_medida: 'g' }
            ]
        };

        await createReceitaRepo(payloadComDuplicata);

        const insercoesDeIngrediente = client.query.mock.calls.filter(([query]) => query.includes('INSERT INTO ingrediente'));
        const associacoes = client.query.mock.calls.filter(([query]) => query.includes('INSERT INTO receita_ingrediente'));
        expect(insercoesDeIngrediente).toHaveLength(0);
        expect(associacoes).toHaveLength(1);
        expect(associacoes[0][1]).toEqual([42, 88, 13, 'kg']);
    });

    test('faz rollback e propaga a falha de uma associação', async () => {
        const falha = new Error('Falha ao associar ingrediente');
        client.query.mockImplementation(async (consulta, valores = []) => {
            if (consulta.includes('INSERT INTO receita_ingrediente')) throw falha;
            if (consulta.includes('INSERT INTO receita (')) return { rows: [{ id: 42 }] };
            if (consulta.includes('FROM ingrediente')) return { rows: [] };
            if (consulta.includes('INSERT INTO ingrediente')) return { rows: [{ id: 100 }] };
            return { rows: [] };
        });

        await expect(createReceitaRepo(payload)).rejects.toBe(falha);
        expect(client.query.mock.calls.map(([query]) => query)).toContain('ROLLBACK');
        expect(client.query.mock.calls.map(([query]) => query)).not.toContain('COMMIT');
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('rejeita receita sem ingredientes antes de abrir a transação', async () => {
        await expect(createReceitaRepo({ ...payload, ingredientes: [] }))
            .rejects.toThrow('A receita deve conter pelo menos um ingrediente.');
        expect(pool.connect).not.toHaveBeenCalled();
    });
});
