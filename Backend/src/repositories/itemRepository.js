const sql = require('../config/database')

// =============================================================================
// LISTAGEM
async function buscarItens() {
    // será implementado quando houver uma forma de autenticação
    //const query = await sql`
    //    SELECT * FROM item
    //    JOIN compra ON item.compra_id = compra.id
    //    JOIN users ON compra.usuario.id = users.id
    //    WHERE users.id = ${usuarioId};
    //`;
    const query = await sql`
        SELECT * FROM item
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
// ATUALIZAÇÃO
async function atualizarPorId(itemId, fieldsToUpdate) {
    const updates = {};

    if(fieldsToUpdate.quantidade !== undefined){
        updates.quantidade = fieldsToUpdate.quantidade;
    }
    if(fieldsToUpdate.valor_unitario !== undefined){
        updates.valor_unitario = fieldsToUpdate.valor_unitario;
    }
    if(fieldsToUpdate.nome !== undefined){
        updates.nome = fieldsToUpdate.nome;
    }
    if(fieldsToUpdate.unidade_de_medida !== undefined){
        updates.unidade_de_medida = fieldsToUpdate.unidade_de_medida;
    }
    if(fieldsToUpdate.validade_estimada !== undefined){
        updates.validade_estimada = fieldsToUpdate.validade_estimada;
    }

    const result = await sql`
        UPDATE item
        SET ${sql(updates)}
        WHERE id = ${itemId}
        RETURNING quantidade, valor_unitario, nome, unidade_de_medida, validade_estimada
    `;
}
// =============================================================================
// REMOÇÃO
async function apagarPorId(id) {
    const query = await sql`
    DELETE FROM item
    WHERE id = ${id}
    RETURNING *;
    `

    return query[0];
}
// =============================================================================

module.exports = { buscarItens, buscarPorId, apagarPorId };
