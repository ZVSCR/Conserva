const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const url = process.env.TEST_DATABASE_URL;
if (url && url === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve ser diferente de DATABASE_URL.');
}

(url ? describe : describe.skip)('gasto total do usuario', () => {
    let pool;
    let client;

    beforeAll(async () => {
        pool = new Pool({ connectionString: url });
        client = await pool.connect();
        await client.query('BEGIN');
        const schema = `teste_gasto_${Date.now()}`;
        await client.query(`CREATE SCHEMA ${schema}`);
        await client.query(`SET LOCAL search_path TO ${schema}`);
        await client.query(`
            CREATE TABLE users (id integer PRIMARY KEY);
            CREATE TABLE compra (
                id integer PRIMARY KEY,
                usuario_id integer REFERENCES users(id) ON DELETE CASCADE,
                valor_total numeric(9, 2) NOT NULL
            );
            INSERT INTO users VALUES (1), (2), (3);
            INSERT INTO compra VALUES (1, 1, 10.10), (2, 1, 20.20);
        `);
        const migration = fs.readFileSync(path.join(__dirname,
            '../../Database/Migrations/usuario_gasto_total.sql'), 'utf8');
        // Mantem toda a suite em uma transacao isolada, incluindo o DDL.
        await client.query(migration.replace(/^BEGIN;$/m, '').replace(/^COMMIT;$/m, ''));
    });

    afterAll(async () => {
        if (client) {
            await client.query('ROLLBACK');
            client.release();
        }
        if (pool) await pool.end();
    });

    async function totais() {
        const { rows } = await client.query('SELECT gasto_total FROM users ORDER BY id');
        return rows.map((row) => row.gasto_total);
    }

    test('carrega compras existentes, aplica diferencas e respeita rollback', async () => {
        expect(await totais()).toEqual(['30.30', '0.00', '0.00']);
        await client.query('INSERT INTO compra VALUES (3, 1, 0.10)');
        expect(await totais()).toEqual(['30.40', '0.00', '0.00']);
        await client.query('UPDATE compra SET valor_total = 5.55 WHERE id = 3');
        expect(await totais()).toEqual(['35.85', '0.00', '0.00']);
        await client.query('UPDATE compra SET usuario_id = 2, valor_total = 7.77 WHERE id = 3');
        expect(await totais()).toEqual(['30.30', '7.77', '0.00']);
        await client.query('SAVEPOINT antes_exclusao');
        await client.query('DELETE FROM compra WHERE id = 3');
        expect(await totais()).toEqual(['30.30', '0.00', '0.00']);
        await client.query('ROLLBACK TO SAVEPOINT antes_exclusao');
        expect(await totais()).toEqual(['30.30', '7.77', '0.00']);
        await client.query('DELETE FROM users WHERE id = 2');
        expect(await totais()).toEqual(['30.30', '0.00']);
    });
});
