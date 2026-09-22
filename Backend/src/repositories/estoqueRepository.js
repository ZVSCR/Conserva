const sql = require('../config/database');

//Listar os itens do estoque
async function buscarEstoque(usuarioId) {
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

//Listar itens com consumo (onde a quantidade disponivel no estoque é menor que a comprada) e seu valor
async function buscarConsumo(usuarioId) {
    const query = await sql`
        SELECT estoque.id,
               estoque.item_id,
               item.nome_item,
               item.quantidade AS quantidade_comprada,
               estoque.quantidade_disponivel,
               item.valor_unitario,
               item.unidade_de_medida,
               (item.quantidade - estoque.quantidade_disponivel) * item.valor_unitario AS valor_gasto
        FROM estoque
        JOIN item ON estoque.item_id = item.id
        WHERE estoque.usuario_id = ${usuarioId}
          AND estoque.quantidade_disponivel < item.quantidade; 
    `;

    return query;
}

module.exports = { buscarEstoque, atualizarQuantidade, buscarConsumo };