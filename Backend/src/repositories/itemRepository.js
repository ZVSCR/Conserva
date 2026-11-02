const sql = require('../config/database');
const pool = require('../config/transactionDatabase');
const { atualizarPorCompraId } = require('./compraRepository');

// =============================================================================
// LISTAGEM  -- Alterei pra ocultar a senha do usuario e mostrar o id dos itens
async function buscarItens(usuarioId) {
    const query = await sql`
        SELECT 
            item.id AS item_id,
            item.nome_item,
            item.quantidade,
            item.unidade_de_medida,
            item.tipo_medida,
            item.valor_unitario,
            ROUND(item.quantidade * item.valor_unitario, 2) AS preco_total_item,
            item.validade_estimada,
            compra.id AS compra_id,
            compra.valor_total,
            compra.estabelecimento,
            compra.data_compra,
            users.id AS usuario_id,
            users.username,
            users.email,
            users.tipo
        FROM item
        JOIN compra ON item.compra_id = compra.id
        JOIN users ON compra.usuario_id = users.id
        WHERE users.id = ${usuarioId};
    `;

    return query;
}

async function buscarPorId(id, usuarioId) {
    const query = await sql`
    SELECT i.*, ROUND(i.quantidade * i.valor_unitario, 2) AS preco_total_item FROM item i
    JOIN compra c ON c.id = i.compra_id
    WHERE i.id = ${id} AND c.usuario_id = ${usuarioId};
    `;

    return query[0];
}

// =============================================================================
// Adicione junto com as funções de LISTAGEM
async function buscarItensPorUsuario(usuarioId) {
    const query = await sql`
        SELECT item.*, ROUND(item.quantidade * item.valor_unitario, 2) AS preco_total_item,
               compra.valor_total, compra.estabelecimento, compra.data_compra
        FROM item
        JOIN compra ON item.compra_id = compra.id
        WHERE compra.usuario_id = ${usuarioId};
    `;
    return query;
}
// =============================================================================
// ATUALIZAÇÃO
async function atualizarPorId(itemId, fieldsToUpdate, usuarioId) {
    const [atual] = await sql`SELECT i.compra_id FROM item i JOIN compra c ON c.id = i.compra_id WHERE i.id = ${itemId} AND c.usuario_id = ${usuarioId};`;
    if (!atual) return undefined;

    const resultado = await atualizarPorCompraId(usuarioId, itemId, atual.compra_id, fieldsToUpdate);
    return resultado.item;
}
// =============================================================================
// REMOÇÃO
async function apagarPorId(id, usuarioId) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { rows: [atual] } = await client.query(`
            SELECT i.compra_id FROM item i JOIN compra c ON c.id = i.compra_id
            WHERE i.id = $1 AND c.usuario_id = $2 FOR UPDATE OF c
        `, [id, usuarioId]);
        if (!atual) {
            await client.query('COMMIT');
            return undefined;
        }
        const { rows: [resultado] } = await client.query(`
            DELETE FROM item i USING compra c
            WHERE i.compra_id = c.id AND i.id = $1 AND c.usuario_id = $2
            RETURNING i.id
        `, [id, usuarioId]);
        await client.query(`
            UPDATE compra SET valor_total = (
                SELECT COALESCE(SUM(ROUND(i.quantidade * i.valor_unitario, 2)), 0)
                FROM item i WHERE i.compra_id = $1
            ) WHERE id = $1
        `, [atual.compra_id]);
        await client.query('COMMIT');
        return resultado;
    } catch (erro) {
        await client.query('ROLLBACK');
        throw erro;
    } finally {
        client.release();
    }
}

module.exports = { buscarItens, buscarPorId, atualizarPorId, apagarPorId, buscarItensPorUsuario };
