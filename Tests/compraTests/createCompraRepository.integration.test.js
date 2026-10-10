// Requer um banco de testes separado, com as tabelas users, compra, item e estoque.
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

describeWithDatabase('createCompraRepo — integração', () => {
    let pool;
    let usuarioId;
    let createCompraRepo;
    let previousDatabaseUrl;

    beforeAll(async () => {
        previousDatabaseUrl = process.env.DATABASE_URL;
        process.env.DATABASE_URL = testDatabaseUrl;
        jest.resetModules();

        ({ createCompraRepo } = require('../../Backend/src/repositories/compraRepository'));
        pool = new Pool({ connectionString: testDatabaseUrl });

        const username = uniqueName('teste_compra');
        const { rows } = await pool.query(
            `INSERT INTO users (username, email, tipo, password_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
            [username, `${username}@example.test`, 'domestico', 'hash-de-teste']
        );
        usuarioId = rows[0].id;
    });

    afterAll(async () => {
        try {
            if (pool && usuarioId) {
                // A exclusão do usuário remove somente os registros criados nesta suíte.
                await pool.query('DELETE FROM users WHERE id = $1', [usuarioId]);
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

    test('cria a compra, seus itens e um lote de estoque por item', async () => {
        const estabelecimento = uniqueName('compra_valida');

        const compra = await createCompraRepo({
            usuario_id: usuarioId,
            data_compra: '2026-09-20',
            estabelecimento,
            valor_total: 29,
            itens: [
                {
                    nome_item: 'Arroz',
                    quantidade: 2,
                    unidade_de_medida: 'kg',
                    tipo_medida: 'variavel',
                    valor_unitario: 8.5,
                    validade_estimada: '2027-03-01'
                },
                {
                    nome_item: 'Feijão',
                    quantidade: 3,
                    unidade_de_medida: 'kg',
                    tipo_medida: 'variavel',
                    valor_unitario: 4,
                    validade_estimada: null
                }
            ]
        });

        expect(compra.id).toEqual(expect.any(Number));

        const { rows: compras } = await pool.query(
            `SELECT usuario_id, data_compra::date::text AS data_compra,
                    estabelecimento, valor_total
             FROM compra WHERE id = $1`,
            [compra.id]
        );
        expect(compras).toHaveLength(1);
        expect(compras[0].usuario_id).toBe(usuarioId);
        expect(compras[0].data_compra).toBe('2026-09-20');
        expect(compras[0].estabelecimento).toBe(estabelecimento);
        expect(Number(compras[0].valor_total)).toBe(29);

        const { rows: lotes } = await pool.query(
            `SELECT i.id AS item_id, i.compra_id, i.nome_item, i.quantidade,
                    i.unidade_de_medida, i.tipo_medida, i.valor_unitario,
                    i.validade_estimada::text AS validade_estimada,
                    e.id AS estoque_id, e.usuario_id,
                    e.quantidade_disponivel
             FROM item AS i
             LEFT JOIN estoque AS e ON e.item_id = i.id
             WHERE i.compra_id = $1
             ORDER BY i.id`,
            [compra.id]
        );

        expect(lotes).toHaveLength(2);
        const arroz = lotes.find(lote => lote.nome_item === 'Arroz');
        const feijao = lotes.find(lote => lote.nome_item === 'Feijão');
        expect(arroz).toBeDefined();
        expect(feijao).toBeDefined();
        expect(arroz.compra_id).toBe(compra.id);
        expect(feijao.compra_id).toBe(compra.id);
        expect(arroz.item_id).not.toBe(feijao.item_id);
        expect(arroz.estoque_id).toEqual(expect.any(Number));
        expect(feijao.estoque_id).toEqual(expect.any(Number));
        expect(arroz.estoque_id).not.toBe(feijao.estoque_id);
        expect(lotes.every(lote => lote.usuario_id === usuarioId)).toBe(true);
        expect(Number(arroz.quantidade_disponivel)).toBe(2);
        expect(Number(feijao.quantidade_disponivel)).toBe(3);
        expect(Number(arroz.quantidade)).toBe(2);
        expect(Number(feijao.quantidade)).toBe(3);
        expect(arroz.unidade_de_medida).toBe('kg');
        expect(feijao.unidade_de_medida).toBe('kg');
        expect(arroz.tipo_medida).toBe('variavel');
        expect(feijao.tipo_medida).toBe('variavel');
        expect(Number(arroz.valor_unitario)).toBe(8.5);
        expect(Number(feijao.valor_unitario)).toBe(4);
        expect(arroz.validade_estimada).toBe('2027-03-01');
        expect(feijao.validade_estimada).toBeNull();
    });

    test('mantém lotes separados mesmo quando os itens têm o mesmo nome', async () => {
        const compra = await createCompraRepo({
            usuario_id: usuarioId,
            data_compra: '2026-09-21',
            estabelecimento: uniqueName('mesmo_produto'),
            valor_total: 14,
            itens: [
                {
                    nome_item: 'Arroz',
                    quantidade: 1,
                    unidade_de_medida: 'kg',
                    tipo_medida: 'variavel',
                    valor_unitario: 6,
                    validade_estimada: '2027-01-01'
                },
                {
                    nome_item: 'Arroz',
                    quantidade: 2,
                    unidade_de_medida: 'kg',
                    tipo_medida: 'variavel',
                    valor_unitario: 4,
                    validade_estimada: '2027-06-01'
                }
            ]
        });

        const { rows } = await pool.query(
            `SELECT i.id AS item_id, e.id AS estoque_id,
                    e.quantidade_disponivel, i.validade_estimada::text AS validade
             FROM item AS i
             LEFT JOIN estoque AS e ON e.item_id = i.id
             WHERE i.compra_id = $1
             ORDER BY i.id`,
            [compra.id]
        );

        expect(rows).toHaveLength(2);
        const primeiroLote = rows.find(row => row.validade === '2027-01-01');
        const segundoLote = rows.find(row => row.validade === '2027-06-01');
        expect(primeiroLote).toBeDefined();
        expect(segundoLote).toBeDefined();
        expect(primeiroLote.item_id).not.toBe(segundoLote.item_id);
        expect(primeiroLote.estoque_id).toEqual(expect.any(Number));
        expect(segundoLote.estoque_id).toEqual(expect.any(Number));
        expect(Number(primeiroLote.quantidade_disponivel)).toBe(1);
        expect(Number(segundoLote.quantidade_disponivel)).toBe(2);
    });

    test('mantém duas embalagens iguais com saldos independentes', async () => {
        const pacote = {
            nome_item: 'Granola', quantidade: 0.5, unidade_de_medida: 'kg',
            tipo_medida: 'variavel', valor_unitario: 20, validade_estimada: null
        };
        const compra = await createCompraRepo({
            usuario_id: usuarioId,
            data_compra: '2026-09-21',
            estabelecimento: uniqueName('granola'),
            valor_total: 20,
            itens: [pacote, pacote]
        });

        const { rows: pacotes } = await pool.query(
            `SELECT i.id, e.quantidade_disponivel FROM item i
             JOIN estoque e ON e.item_id = i.id
             WHERE i.compra_id = $1 ORDER BY i.id`,
            [compra.id]
        );
        expect(pacotes).toHaveLength(2);
        expect(pacotes[0].id).not.toBe(pacotes[1].id);

        await pool.query('UPDATE estoque SET quantidade_disponivel = 0.2 WHERE item_id = $1', [pacotes[0].id]);
        const { rows: saldos } = await pool.query(
            `SELECT quantidade_disponivel FROM estoque
             WHERE item_id IN ($1, $2) ORDER BY item_id`,
            [pacotes[0].id, pacotes[1].id]
        );
        expect(saldos.map(saldo => Number(saldo.quantidade_disponivel))).toEqual([0.2, 0.5]);
    });

    test('desfaz toda a compra se a inserção do segundo item falhar', async () => {
        const estabelecimento = uniqueName('compra_rollback');

        await expect(createCompraRepo({
            usuario_id: usuarioId,
            data_compra: '2026-09-22',
            estabelecimento,
            valor_total: 5,
            itens: [
                {
                    nome_item: 'Primeiro item',
                    quantidade: 1,
                    unidade_de_medida: 'un',
                    tipo_medida: 'unitaria',
                    valor_unitario: 2,
                    validade_estimada: null
                },
                {
                    // Excede o VARCHAR(100) e força uma falha depois do primeiro item.
                    nome_item: 'X'.repeat(101),
                    quantidade: 1,
                    unidade_de_medida: 'un',
                    tipo_medida: 'unitaria',
                    valor_unitario: 3,
                    validade_estimada: null
                }
            ]
        })).rejects.toThrow();

        const { rows } = await pool.query(
            `SELECT COUNT(*)::int AS total
             FROM compra
             WHERE usuario_id = $1 AND estabelecimento = $2`,
            [usuarioId, estabelecimento]
        );
        expect(rows[0].total).toBe(0);
    });
});
