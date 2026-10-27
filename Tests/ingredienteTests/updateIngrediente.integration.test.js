// Requer um banco de testes separado; nunca use DATABASE_URL como TEST_DATABASE_URL.
require('dotenv').config();
const { Pool } = require('pg');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}

const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('renomeação de ingrediente padrão — integração', () => {
    let pool;
    let updateIngredienteRepo;
    let garantirIngredientesPadrao;
    let previousDatabaseUrl;

    beforeAll(() => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();
        ({ updateIngredienteRepo } = require('../../Backend/src/repositories/ingredienteRepository'));
        ({ garantirIngredientesPadrao } = require('../../Backend/src/services/ingredienteService'));
        pool = new Pool({ connectionString: testDatabaseUrl });
    });

    afterAll(async () => {
        try {
            if (pool) await pool.end();
        } finally {
            if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
            else process.env.DATABASE_URL = previousDatabaseUrl;
        }
    });

    test('mantém o ID e o novo nome após a carga inicial seguinte', async () => {
        await garantirIngredientesPadrao();
        const { rows: [original] } = await pool.query(
            'SELECT id FROM ingrediente WHERE nome = $1', ['ovo']
        );
        const novoNome = `ovo renomeado ${Date.now()}`;

        try {
            await expect(updateIngredienteRepo(original.id, { nome: novoNome }))
                .resolves.toEqual({ id: original.id, nome: novoNome });

            await garantirIngredientesPadrao();

            const { rows } = await pool.query(
                'SELECT id, nome FROM ingrediente WHERE id = $1 OR nome = $2',
                [original.id, 'ovo']
            );
            expect(rows).toEqual([{ id: original.id, nome: novoNome }]);
        } finally {
            await pool.query('DELETE FROM ingrediente WHERE nome = $1 AND id <> $2', ['ovo', original.id]);
            await pool.query('UPDATE ingrediente SET nome = $1 WHERE id = $2', ['ovo', original.id]);
        }
    });
});
