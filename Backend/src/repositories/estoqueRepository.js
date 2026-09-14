const sql = require('../config/database');

//Listar os itens do estoque
async function buscarEstoque() {
    const query = await sql`
        SELECT estoque.id,
               estoque.item_id,
               estoque.quantidade_disponivel,
               item.nome_item,
               item.unidade_de_medida,
               item.validade_estimada
        FROM estoque
        JOIN item ON estoque.item_id = item.id
        WHERE estoque.usuario_id = ${usuarioId};
    `;

    return query;
}

//Atualizar a quantidade de um item no estoque pela id do item
async function atualizarQuantidade(itemId, novaQuantidade) {
    const query = await sql`
        UPDATE estoque
        SET quantidade_disponivel = ${novaQuantidade}
        WHERE item_id = ${itemId}
        RETURNING *;
    `;

    return query[0];
}

module.exports = { buscarEstoque, atualizarQuantidade };