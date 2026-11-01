// Requer banco separado com Database/Create/merge.sql e Database/Triggers/gastoEstoque.sql aplicados.
// Os dados de cada teste ficam em uma transação revertida ao final.
const { Pool } = require('pg');
const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (testDatabaseUrl && testDatabaseUrl === process.env.DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL deve apontar para um banco diferente de DATABASE_URL.');
}

const describeWithDatabase = testDatabaseUrl ? describe : describe.skip;

describeWithDatabase('estoque — integração com PostgreSQL', () => {
    let pool;
    let client;
    let repo;
    let apagarPorId;
    let usuarioId;
    let outroUsuarioId;
    let itens;
    let compraId;

    beforeAll(async () => {
        pool = new Pool({ connectionString: testDatabaseUrl });
        client = await pool.connect();
        // Executa o SQL real do repositório na mesma conexão para permitir ROLLBACK.
        jest.resetModules();
        jest.doMock('../../Backend/src/config/database', () => async (partes, ...valores) => {
            const texto = partes.reduce((sql, parte, indice) => sql + (indice ? `$${indice}` : '') + parte, '');
            const { rows } = await client.query(texto, valores);
            return rows;
        });
        repo = require('../../Backend/src/repositories/estoqueRepository');
        ({ apagarPorId } = require('../../Backend/src/repositories/itemRepository'));
    });

    beforeEach(async () => {
        await client.query('BEGIN');
        const sufixo = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const { rows: usuarios } = await client.query(
            `INSERT INTO users (username, email, tipo, password_hash) VALUES
             ($1, $2, 'domestico', 'hash-de-teste'), ($3, $4, 'domestico', 'hash-de-teste') RETURNING id`,
            [`estoque_${sufixo}`, `estoque_${sufixo}@example.test`, `outro_${sufixo}`, `outro_${sufixo}@example.test`]
        );
        [usuarioId, outroUsuarioId] = usuarios.map(usuario => usuario.id);
        const { rows: compras } = await client.query(
            'INSERT INTO compra (usuario_id, valor_total) VALUES ($1, 28), ($2, 90) RETURNING id',
            [usuarioId, outroUsuarioId]
        );
        compraId = compras[0].id;
        const { rows } = await client.query(
            `INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, tipo_medida, valor_unitario)
             VALUES ($1, 'Arroz', 5, 'kg', 'variavel', 2),
                    ($1, 'Ovos', 3, 'un', 'unitaria', 4),
                    ($1, 'Leite', 2, 'L', 'variavel', 3),
                    ($2, 'Outro produto', 9, 'kg', 'variavel', 10) RETURNING id`,
            [compraId, compras[1].id]
        );
        itens = rows.map(item => item.id);
        await client.query(
            `INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
             VALUES ($1, $3, 5), ($1, $4, 1), ($1, $5, 0), ($2, $6, 9)`,
            [usuarioId, outroUsuarioId, ...itens]
        );
    });

    afterEach(async () => {
        if (client) await client.query('ROLLBACK');
    });

    afterAll(async () => {
        if (client) client.release();
        if (pool) await pool.end();
        jest.dontMock('../../Backend/src/config/database');
        jest.resetModules();
    });

    test('lista somente os lotes do usuário e seus detalhes', async () => {
        const estoque = await repo.buscarEstoque(usuarioId);
        expect(estoque).toHaveLength(3);
        expect(estoque.map(item => item.item_id).sort((a, b) => a - b)).toEqual(itens.slice(0, 3));
        const arroz = estoque.find(item => item.item_id === itens[0]);
        expect(arroz).toEqual(expect.objectContaining({ nome_item: 'Arroz', tipo_medida: 'variavel', unidade_de_medida: 'kg' }));
        expect(Number(arroz.quantidade_original)).toBe(5);
        expect(Number(arroz.quantidade_disponivel)).toBe(5);
        await expect(repo.buscarDetalheEstoque(usuarioId, itens[3])).resolves.toBeUndefined();
    });

    test('calcula o valor disponível e ordena os itens pelo nome', async () => {
        const gastos = await repo.buscarValorEstoquePorUsuario(usuarioId);
        expect(Number(gastos.valor_total_estoque)).toBe(14);
        const lista = await repo.buscarItensEstoquePorUsuario(usuarioId);
        expect(lista.map(item => item.nome_item)).toEqual(['Arroz', 'Leite', 'Ovos']);
        expect(lista.map(item => Number(item.valor_total_item))).toEqual([10, 0, 4]);
    });

    test('lista consumo parcial e total, excluindo lotes intactos e de outras contas', async () => {
        const consumo = await repo.buscarConsumo(usuarioId);
        expect(consumo).toHaveLength(2);
        const ovos = consumo.find(item => item.item_id === itens[1]);
        const leite = consumo.find(item => item.item_id === itens[2]);
        expect(Number(ovos.quantidade_comprada)).toBe(3);
        expect(Number(ovos.valor_gasto)).toBe(8);
        expect(Number(leite.valor_gasto)).toBe(6);
    });

    test('atualiza saldo fracionado, recalcula os valores e alterna a flag gasto', async () => {
        const atualizado = await repo.atualizarQuantidade(usuarioId, itens[0], 0.25);
        expect(Number(atualizado.quantidade_disponivel)).toBe(0.25);
        expect(atualizado.gasto).toBe(true);
        const gastos = await repo.buscarValorEstoquePorUsuario(usuarioId);
        expect(Number(gastos.valor_total_estoque)).toBe(4.5);
        const consumo = await repo.buscarConsumo(usuarioId);
        expect(Number(consumo.find(item => item.item_id === itens[0]).valor_gasto)).toBe(9.5);
        const restaurado = await repo.atualizarQuantidade(usuarioId, itens[0], 5);
        expect(restaurado.gasto).toBe(false);
    });

    test.each([[-1, 0], [5.01, 0], [1.5, 1]])(
        'a proteção SQL rejeita saldo %s para o lote %s sem alterá-lo', async (quantidade, indice) => {
            const antes = await repo.buscarDetalheEstoque(usuarioId, itens[indice]);
            await expect(repo.atualizarQuantidade(usuarioId, itens[indice], quantidade)).resolves.toBeUndefined();
            await expect(repo.buscarDetalheEstoque(usuarioId, itens[indice])).resolves.toEqual(antes);
        }
    );

    test('não atualiza estoque de outro usuário', async () => {
        await expect(repo.atualizarQuantidade(usuarioId, itens[3], 0)).resolves.toBeUndefined();
        const detalhe = await repo.buscarDetalheEstoque(outroUsuarioId, itens[3]);
        expect(Number(detalhe.quantidade_disponivel)).toBe(9);
    });

    test('aceita saldo zero para item unitário', async () => {
        const atualizado = await repo.atualizarQuantidade(usuarioId, itens[1], 0);
        expect(Number(atualizado.quantidade_disponivel)).toBe(0);
        expect(atualizado.gasto).toBe(true);
    });

    test('a exclusão do produto remove seu estoque e recompõe o total da compra', async () => {
        await expect(apagarPorId(itens[0], usuarioId)).resolves.toEqual({ id: itens[0] });
        await expect(repo.buscarDetalheEstoque(usuarioId, itens[0])).resolves.toBeUndefined();
        const { rows: [compra] } = await client.query('SELECT valor_total FROM compra WHERE id = $1', [compraId]);
        expect(Number(compra.valor_total)).toBe(18);
        expect(await repo.buscarEstoque(usuarioId)).toHaveLength(2);
    });

    test('usuário sem estoque tem listas vazias e total zero', async () => {
        await client.query('DELETE FROM estoque WHERE usuario_id = $1', [usuarioId]);
        await expect(repo.buscarEstoque(usuarioId)).resolves.toEqual([]);
        await expect(repo.buscarItensEstoquePorUsuario(usuarioId)).resolves.toEqual([]);
        await expect(repo.buscarConsumo(usuarioId)).resolves.toEqual([]);
        expect(Number((await repo.buscarValorEstoquePorUsuario(usuarioId)).valor_total_estoque)).toBe(0);
    });
});
