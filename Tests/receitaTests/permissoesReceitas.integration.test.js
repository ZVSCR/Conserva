const { Pool } = require('pg');
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}
const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

// Tabelas temporárias isolam os testes dos dados existentes no banco de testes.
describeWithDatabase('permissões de receitas públicas e pessoais — SQL real', () => {
    let pool;
    let client;
    let repo;
    beforeAll(async () => {
        pool = new Pool({ connectionString: testDatabaseUrl });
        client = await pool.connect();
        await client.query('BEGIN');
        await client.query(`
            CREATE TEMP TABLE receita (id INT PRIMARY KEY, usuario_id INT, nome TEXT, descricao TEXT, modo_preparo TEXT);
            CREATE TEMP TABLE ingrediente (id INT PRIMARY KEY, nome TEXT);
            CREATE TEMP TABLE receita_ingrediente (
                receita_id INT REFERENCES receita(id) ON DELETE CASCADE,
                ingrediente_id INT REFERENCES ingrediente(id), quantidade NUMERIC(9,2), unidade_de_medida TEXT,
                PRIMARY KEY (receita_id, ingrediente_id)
            );
        `);
        jest.resetModules();
        jest.doMock('../../Backend/src/config/database', () => async (parts, ...values) => {
            const query = parts.reduce((text, part, index) => text + (index ? `$${index}` : '') + part, '');
            return (await client.query(query, values)).rows;
        });
        jest.doMock('../../Backend/src/config/transactionDatabase', () => ({ connect: jest.fn() }));
        repo = require('../../Backend/src/repositories/receitaRepository');
    });
    beforeEach(async () => {
        await client.query(`
            TRUNCATE receita_ingrediente, receita, ingrediente;
            INSERT INTO receita VALUES (1,1,'r1','d','m'), (2,NULL,'r2','d','m'), (3,7,'r3','d','m'), (4,42,'r4','d','m');
            INSERT INTO ingrediente VALUES (88,'fuba');
            INSERT INTO receita_ingrediente SELECT id,88,1,'kg' FROM receita;
        `);
    });
    afterAll(async () => {
        try {
            if (client) await client.query('ROLLBACK');
        } finally {
            if (client) client.release();
            if (pool) await pool.end();
        }
    });

    test('usuário vê as receitas do administrador, públicas e suas próprias', async () => {
        expect((await repo.listReceitasRepo(7)).map(r => r.id)).toEqual([1, 2, 3]);
        expect((await repo.getReceitaByIdRepo(1, 7)).id).toBe(1);
        expect(await repo.getReceitaByIdRepo(4, 7)).toBeUndefined();
    });

    test.each([[7,1,false], [7,2,false], [7,3,true], [7,4,false], [1,1,true], [1,2,true], [1,3,false]])(
        'sessão %s, receita %s: alteração permitida=%s', async (usuarioId, receitaId, permitido) => {
            const resultado = await repo.atualizarQuantidadeIngredienteReceitaRepo(receitaId, 88, 2.5, usuarioId);
            expect(Boolean(resultado)).toBe(permitido);
            const { rows: [vinculo] } = await client.query('SELECT quantidade FROM receita_ingrediente WHERE receita_id=$1', [receitaId]);
            expect(Number(vinculo.quantidade)).toBe(permitido ? 2.5 : 1);
            const atualizada = await repo.updateReceitaRepo(receitaId, { nome: 'alterada', descricao: 'd', modo_preparo: 'm' }, usuarioId);
            expect(Boolean(atualizada)).toBe(permitido);
            const removido = await repo.removerIngredienteReceitaRepo(receitaId, 88, usuarioId);
            expect(Boolean(removido)).toBe(permitido);
            if (permitido) {
                await expect(repo.apagarReceitaPorId(usuarioId, receitaId)).resolves.toBeDefined();
            } else {
                await expect(repo.apagarReceitaPorId(usuarioId, receitaId)).rejects.toBeInstanceOf(repo.ReceitaNaoEncontradaError);
            }
            expect((await client.query('SELECT id FROM ingrediente')).rows).toEqual([{ id: 88 }]);
        }
    );
});
