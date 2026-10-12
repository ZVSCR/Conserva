// Executar somente contra um banco de testes separado:
// TEST_DATABASE_URL=... npm test -- --runInBand Tests/receitaTests/updateReceita.integration.test.js
const { Pool } = require('pg');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}

const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;
const suiteTag = `teste_patch_receita_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

describeWithDatabase('updateReceitaRepo — integração', () => {
    let pool;
    let updateReceitaRepo;
    let previousDatabaseUrl;
    const ids = [];

    async function criar(nome) {
        const { rows: [receita] } = await pool.query(
            'INSERT INTO receita (nome, descricao, modo_preparo) VALUES ($1, $2, $3) RETURNING id',
            [nome, 'Descrição original', 'Preparo original']
        );
        ids.push(receita.id);
        return receita.id;
    }

    async function buscar(id) {
        const { rows: [receita] } = await pool.query(
            'SELECT id, nome, descricao, modo_preparo FROM receita WHERE id = $1', [id]
        );
        return receita;
    }

    beforeAll(async () => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();
        ({ updateReceitaRepo } = require('../../Backend/src/repositories/receitaRepository'));
        pool = new Pool({ connectionString: testDatabaseUrl });
    });

    afterAll(async () => {
        try {
            if (pool && ids.length) {
                await pool.query('DELETE FROM receita WHERE id = ANY($1::int[])', [ids]);
            }
        } finally {
            if (pool) await pool.end();
            if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = previousDatabaseUrl;
        }
    });

    test('recebe os três campos e preserva os valores que não mudaram', async () => {
        const nome = `${suiteTag}_alteracao`;
        const id = await criar(nome);
        const payload = {
            nome,
            descricao: 'Descrição nova',
            modo_preparo: 'Preparo original'
        };

        const atualizada = await updateReceitaRepo(id, payload);

        expect(atualizada).toEqual(expect.objectContaining({
            id, ...payload
        }));
        expect(await buscar(id)).toEqual({ id, ...payload });
    });

    test('não modifica outra receita e trata aspas e SQL como texto', async () => {
        const id = await criar(`${suiteTag}_alvo`);
        const outroId = await criar(`${suiteTag}_outro`);
        const texto = "Pão d'água'); DROP TABLE receita;--";

        await updateReceitaRepo(id, {
            nome: `${suiteTag}_alvo`,
            descricao: 'Descrição original',
            modo_preparo: texto
        });

        expect((await buscar(id)).modo_preparo).toBe(texto);
        expect(await buscar(outroId)).toEqual({
            id: outroId, nome: `${suiteTag}_outro`,
            descricao: 'Descrição original', modo_preparo: 'Preparo original'
        });
    });

    test('retorna null quando o id não existe', async () => {
        await expect(updateReceitaRepo(2147483647, {
            nome: 'Inexistente',
            descricao: 'Descrição',
            modo_preparo: 'Preparo'
        }))
            .resolves.toBeNull();
    });
});
