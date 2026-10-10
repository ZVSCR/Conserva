// Requer um banco de testes separado, com a tabela receita (id, nome, descricao, modo_preparo).
// Como o repositório usa o driver serverless da Neon, TEST_DATABASE_URL deve ser uma
// connection string Neon (por exemplo, uma branch só de testes).
// Execute com TEST_DATABASE_URL configurada; nunca use a URL do banco normal.
const { Pool } = require('pg');

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}

const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

function uniqueName(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Todo nome criado nesta suíte começa com este prefixo, o que permite limpar tudo no final.
const suiteTag = uniqueName('teste_receita');

function receitaNome(sufixo) {
    return `${suiteTag}_${sufixo}`;
}

describeWithDatabase('createReceitaRepo — integração', () => {
    let pool;
    let createReceitaRepo;
    let previousDatabaseUrl;

    async function buscarReceita(id) {
        const { rows } = await pool.query(
            'SELECT nome, descricao, modo_preparo FROM receita WHERE id = $1',
            [id]
        );
        return rows;
    }

    beforeAll(async () => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();

        ({ createReceitaRepo } = require('../../Backend/src/repositories/receitaRepository'));
        pool = new Pool({ connectionString: testDatabaseUrl });
    });

    afterAll(async () => {
        try {
            if (pool) {
                // Remove somente as receitas criadas nesta suíte.
                await pool.query('DELETE FROM receita WHERE nome LIKE $1', [`${suiteTag}%`]);
            }
        } finally {
            if (pool) await pool.end();
            if (previousDatabaseUrl === undefined) {
                delete process.env.DATABASE_URL;
            } else {
                process.env.DATABASE_URL = previousDatabaseUrl;
            }
        }
    });

    test('grava a receita com os campos informados e devolve o id', async () => {
        const payload = {
            nome: receitaNome('bolo_de_fuba'),
            descricao: 'Bolo simples e gostoso. Tempo de preparo: 60min',
            modo_preparo: 'Misture os ingredientes, leve ao forno e aguarde.'
        };

        const receita = await createReceitaRepo(payload);

        expect(receita.id).toEqual(expect.any(Number));

        const rows = await buscarReceita(receita.id);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(payload);
    });

    test('gera ids distintos para receitas criadas em sequência', async () => {
        const primeira = await createReceitaRepo({
            nome: receitaNome('sequencia_1'),
            descricao: 'Primeira receita',
            modo_preparo: 'Passo a passo da primeira'
        });
        const segunda = await createReceitaRepo({
            nome: receitaNome('sequencia_2'),
            descricao: 'Segunda receita',
            modo_preparo: 'Passo a passo da segunda'
        });

        expect(primeira.id).not.toBe(segunda.id);
        expect(await buscarReceita(primeira.id)).toHaveLength(1);
        expect(await buscarReceita(segunda.id)).toHaveLength(1);
    });

    test('preserva acentos, quebras de linha e trata aspas e SQL como texto', async () => {
        const payload = {
            nome: receitaNome("pao_d'agua'); DROP TABLE receita;--"),
            descricao: 'Pão d\'água — "crocante" por fora, macio por dentro',
            modo_preparo: '1. Misture a farinha.\n2. Descanse a massa.\n3. Asse até dourar.'
        };

        const receita = await createReceitaRepo(payload);

        const rows = await buscarReceita(receita.id);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toEqual(payload);
    });

    test('aceita textos nos tamanhos máximos permitidos pelo validador', async () => {
        const payload = {
            nome: receitaNome('limites').padEnd(100, 'x'),
            descricao: 'd'.repeat(1000),
            modo_preparo: 'm'.repeat(10000)
        };

        const receita = await createReceitaRepo(payload);

        const rows = await buscarReceita(receita.id);
        expect(rows).toHaveLength(1);
        expect(rows[0].nome).toHaveLength(100);
        expect(rows[0].descricao).toHaveLength(1000);
        expect(rows[0].modo_preparo).toHaveLength(10000);
    });

    test('não grava nada quando o banco rejeita os dados', async () => {
        // Assume nome VARCHAR(100): 101 caracteres forçam uma falha do banco.
        // Se a coluna for TEXT, remova este teste.
        const nomeLongo = receitaNome('falha').padEnd(101, 'x');

        await expect(createReceitaRepo({
            nome: nomeLongo,
            descricao: 'Receita que não deve ser gravada',
            modo_preparo: 'Sem modo de preparo'
        })).rejects.toThrow();

        const { rows } = await pool.query(
            'SELECT COUNT(*)::int AS total FROM receita WHERE nome = $1',
            [nomeLongo]
        );
        expect(rows[0].total).toBe(0);
    });
});