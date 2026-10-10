const sql = require('../config/database');
const { atualizarPorCompraId } = require('./compraRepository');

// =============================================================================
// LISTAGEM  -- Alterei pra ocultar a senha do usuario e mostrar o id dos itens
async function buscarItens() {
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
        JOIN users ON compra.usuario_id = users.id;
    `;

    return query;
}

async function buscarPorId(id) {
    const query = await sql`
    SELECT * FROM item
    WHERE id = ${id};
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
async function atualizarPorId(itemId, fieldsToUpdate) {
    const [atual] = await sql`SELECT compra_id FROM item WHERE id = ${itemId};`;
    if (!atual) return undefined;

    const resultado = await atualizarPorCompraId(itemId, atual.compra_id, fieldsToUpdate);
    return resultado.item;
}
// =============================================================================
// REMOÇÃO
async function apagarPorId(id) {
    const [resultado] = await sql`
        WITH item_apagado AS (
            DELETE FROM item WHERE id = ${id}
            RETURNING id, compra_id
        )
        UPDATE compra AS c
        SET valor_total = (
            SELECT COALESCE(SUM(i.quantidade * i.valor_unitario), 0)
            FROM item i WHERE i.compra_id = c.id AND i.id <> ${id}
        )
        FROM item_apagado AS apagado
        WHERE c.id = apagado.compra_id
        RETURNING apagado.id;
    `;
    return resultado;
}

module.exports = { buscarItens, buscarPorId, atualizarPorId, apagarPorId, buscarItensPorUsuario };
