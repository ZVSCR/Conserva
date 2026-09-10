const sql = require('../config/database')

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

module.exports = { buscarItens, buscarPorId };