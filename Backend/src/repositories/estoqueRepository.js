const sql = require('../config/database');

//Listar os itens do estoque
async function buscarEstoque(usuarioId) {
    const query = await sql`
        SELECT estoque.id,
               estoque.item_id,
               estoque.quantidade_disponivel,
               estoque.gasto,
               item.nome_item,
               item.quantidade AS quantidade_original,
               item.tipo_medida,
               item.unidade_de_medida,
               item.validade_estimada,
               item.quantidade AS quantidade_original
        FROM estoque
        JOIN item ON estoque.item_id = item.id
        WHERE estoque.usuario_id = ${usuarioId};
    `;

    return query;
}

async function buscarDetalheEstoque(usuarioId, itemId) {
    const [detalhe] = await sql`
        SELECT item.quantidade AS quantidade_original,
               item.tipo_medida,
               estoque.quantidade_disponivel
        FROM estoque
        JOIN item ON item.id = estoque.item_id
        WHERE estoque.usuario_id = ${usuarioId} AND estoque.item_id = ${itemId};
    `;
    return detalhe;
}

// Atualização protegida: a verificação ocorre no mesmo comando que grava o saldo.
async function atualizarQuantidade(usuarioId, itemId, novaQuantidade) {
    const query = await sql`
        UPDATE estoque AS e
        SET quantidade_disponivel = ${novaQuantidade}
        FROM item AS i
        WHERE e.item_id = i.id
          AND e.usuario_id = ${usuarioId}
          AND e.item_id = ${itemId}
          AND ${novaQuantidade}::numeric BETWEEN 0 AND i.quantidade
          AND (i.tipo_medida = 'variavel' OR ${novaQuantidade}::numeric = trunc(${novaQuantidade}::numeric))
        RETURNING e.*;
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
            i.quantidade AS quantidade_original,
            i.tipo_medida,
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

//Listar itens com consumo (onde a quantidade disponivel no estoque é menor que a comprada) e seu valor
async function buscarConsumo(usuarioId) {
    const query = await sql`
        SELECT estoque.id,
               estoque.item_id,
               item.nome_item,
               item.quantidade AS quantidade_comprada,
               estoque.quantidade_disponivel,
               item.valor_unitario,
               item.tipo_medida,
               item.unidade_de_medida,
               (item.quantidade - estoque.quantidade_disponivel) * item.valor_unitario AS valor_gasto
        FROM estoque
        JOIN item ON estoque.item_id = item.id
        WHERE estoque.usuario_id = ${usuarioId}
          AND estoque.quantidade_disponivel < item.quantidade; 
    `;

    return query;
}
module.exports = { buscarEstoque, buscarDetalheEstoque, atualizarQuantidade, buscarValorEstoquePorUsuario, buscarItensEstoquePorUsuario, buscarConsumo };
