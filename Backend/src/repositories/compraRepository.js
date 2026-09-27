const sql = require('../config/database')
const pool = require('../config/transactionDatabase');

async function atualizarPorCompraId(itemId, compraId, fieldsToUpdate) {
    const updates = {};

    if (fieldsToUpdate.quantidade !== undefined) {
        updates.quantidade = fieldsToUpdate.quantidade;
    }
    if (fieldsToUpdate.valor_unitario !== undefined) {
        updates.valor_unitario = fieldsToUpdate.valor_unitario;
    }
    if (fieldsToUpdate.nome_item !== undefined) {
        updates.nome_item = fieldsToUpdate.nome_item;
    }
    if (fieldsToUpdate.unidade_de_medida !== undefined) {
        updates.unidade_de_medida = fieldsToUpdate.unidade_de_medida;
    }
    if (fieldsToUpdate.validade_estimada !== undefined) {
        updates.validade_estimada = fieldsToUpdate.validade_estimada;
    }

    const result = await sql.begin(async (sql) => {
        const [itemAtualizado] = await sql`
            UPDATE item
            SET 
                quantidade = COALESCE(${updates.quantidade ?? null}, quantidade),
                valor_unitario = COALESCE(${updates.valor_unitario ?? null}, valor_unitario),
                nome_item = COALESCE(${updates.nome_item ?? null}, nome_item),
                unidade_de_medida = COALESCE(${updates.unidade_de_medida ?? null}, unidade_de_medida),
                validade_estimada = COALESCE(${updates.validade_estimada ?? null}, validade_estimada)
            WHERE id = ${itemId} AND compra_id = ${compraId}
            RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada;
        `;

        if (!itemAtualizado) {
            throw new Error('Item não encontrado para essa compra.');
        }

        const [compraAtualizada] = await sql`
            UPDATE compra
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
                FROM item
                WHERE compra_id = ${compraId}
            )
            WHERE id = ${compraId}
            RETURNING id, valor_total;
        `;

        return { item: itemAtualizado, compra: compraAtualizada };
    });

    return result;

}

async function createCompraRepo(dadosCompra) {
    const {
        usuario_id,
        data_compra,
        estabelecimento,
        valor_total,
        itens,
    } = dadosCompra;

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        // Cria registro de compra
        const {
            rows: [{ id: compraId }],
        } = await client.query(`
            INSERT INTO compra (usuario_id, data_compra, valor_total, estabelecimento)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [
                usuario_id,
                data_compra,
                valor_total,
                estabelecimento
            ]
        );

        for (const item of itens) {

            // Cria lotes para cada item
            const {
                rows: [{ id: itemId }],
            } = await client.query(`
                    INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `,
                [
                    compraId,
                    item.nome_item,
                    item.quantidade,
                    item.unidade_de_medida,
                    item.valor_unitario,
                    item.validade_estimada
                ]
            );

            // Insere lotes no estoque de usuário
            await client.query(`
                INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
                VALUES ($1, $2, $3)
                `,
                [
                    usuario_id,
                    itemId,
                    item.quantidade
                ]
            );
        }

        // Se tudo for bem sucedido, salva todas as operações
        await client.query('COMMIT');

        // Retorna o objeto de compra com o ID criado
        return { id: compraId };
    } catch (err) {

        // Erro detectado, desfaz todas as operações
        await client.query('ROLLBACK');
        throw err;
    } finally {

        client.release();
    }
}

module.exports = {
    atualizarPorCompraId,
    createCompraRepo
};