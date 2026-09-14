const sql = require('../config/database');

async function atualizarQuantidade(itemId, novaQuantidade) {
    const query = await sql`
        UPDATE estoque
        SET quantidade_disponivel = ${novaQuantidade}
        WHERE item_id = ${itemId}
        RETURNING *;
    `;

    return query[0];
}

module.exports = { atualizarQuantidade };