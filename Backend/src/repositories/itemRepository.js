const sql = require('../config/database');
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
    SELECT i.* FROM item i
    JOIN compra c ON c.id = i.compra_id
    WHERE i.id = ${id} AND c.usuario_id = ${usuarioId};
    `;

    return query[0];
}

// =============================================================================
// Adicione junto com as funções de LISTAGEM
async function buscarItensPorUsuario(usuarioId) {
    const query = await sql`
        SELECT item.*, compra.valor_total, compra.estabelecimento, compra.data_compra
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
    const [resultado] = await sql`
        WITH item_apagado AS (
            DELETE FROM item i USING compra c
            WHERE i.compra_id = c.id AND i.id = ${id} AND c.usuario_id = ${usuarioId}
            RETURNING i.id, i.compra_id
        )
        UPDATE compra AS c
        SET valor_total = (
            SELECT COALESCE(SUM(ROUND(i.quantidade * i.valor_unitario, 2)), 0)
            FROM item i WHERE i.compra_id = c.id AND i.id <> ${id}
        )
        FROM item_apagado AS apagado
        WHERE c.id = apagado.compra_id
        RETURNING apagado.id;
    `;
    return resultado;
}

module.exports = { buscarItens, buscarPorId, atualizarPorId, apagarPorId, buscarItensPorUsuario };
