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

async function buscarValorEstoquePorUsuario(usuarioId) {
    const result = await sql`
        SELECT 
            u.id, 
            u.username, 
            COALESCE(SUM(e.quantidade_disponivel * i.valor_unitario), 0) AS valor_total_estoque
        FROM users u
        LEFT JOIN estoque e ON u.id = e.usuario_id
        LEFT JOIN item i ON e.item_id = i.id
        WHERE u.id = ${usuarioId}
        GROUP BY u.id, u.username;
    `;

    return result[0];
}

async function buscarItensEstoquePorUsuario(usuarioId) {
    const result = await sql`
        SELECT 
            e.id AS estoque_id,
            i.id AS item_id,
            i.nome_item,
            i.unidade_de_medida,
            e.quantidade_disponivel,
            i.valor_unitario,
            (e.quantidade_disponivel * i.valor_unitario) AS valor_total_item
        FROM estoque e
        JOIN item i ON i.id = e.item_id
        WHERE e.usuario_id = ${usuarioId}
        ORDER BY i.nome_item;
    `;

    return result;
}

module.exports = { buscarEstoque, atualizarQuantidade, buscarValorEstoquePorUsuario, buscarItensEstoquePorUsuario };