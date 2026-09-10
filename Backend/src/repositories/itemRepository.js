const sql = require('../config/database')

async function buscarItens() {
    try {
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
            JOIN users ON compra.usuario.id = users.id;
        `;
        const resultado = query[0];

        return resultado
    } catch (erro) {
       return erro;
    }
}

async function buscarPorId(id) {
    try {
        const query = await sql`
        SELECT * FROM item
        WHERE id = ${id};
        `;
        const resultado = query[0];

        return resultado
    } catch (erro) {
        return erro;
    }
}

module.exports = { buscarItens, buscarPorId };