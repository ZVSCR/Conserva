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
    const updates = {};

    if (fieldsToUpdate.quantidade !== undefined) {
        updates.quantidade = fieldsToUpdate.quantidade;
    }
    if (fieldsToUpdate.valor_unitario !== undefined) {
        updates.valor_unitario = fieldsToUpdate.valor_unitario;
    }
    if (fieldsToUpdate.nome_item !== undefined) {
        updates.nome_item = fieldsToUpdate.nome_item;
    }
    if (fieldsToUpdate.unidade_de_medida !== undefined) {
        updates.unidade_de_medida = fieldsToUpdate.unidade_de_medida;
    }
    if (fieldsToUpdate.validade_estimada !== undefined) {
        updates.validade_estimada = fieldsToUpdate.validade_estimada;
    }

    const result = await sql`
        UPDATE item
        SET 
        quantidade = COALESCE(${updates.quantidade}, quantidade),
        valor_unitario = COALESCE(${updates.valor_unitario}, valor_unitario),
        nome_item = COALESCE(${updates.nome_item}, nome_item),
        unidade_de_medida = COALESCE(${updates.unidade_de_medida}, unidade_de_medida),
        validade_estimada = COALESCE(${updates.validade_estimada}, validade_estimada)
        WHERE id = ${itemId}
        RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada;
    `;

    return result[0];
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

// =============================================================================
// CRIAÇÃO
async function criarItem(
    usuarioId, 
    nomeItem, 
    quantidade, 
    unidadeDeMedida, 
    valorUnitario, 
    validadeEstimada, 
    compraId
) {
    // Ao usar uma única operação, garantimos que quaisquer erros nesse pipeline
    // serão suficientes para impedir toda a operação. Assim, temos a certeza de
    // que nenhum item é criado caso a compra não exista ou nenhuma atualização
    // na compra/no estoque ocorre se houver um erro no banco de dados.
    const [resultado] = await sql`
        WITH compra_atualizada AS (
            UPDATE compra
            SET valor_total = COALESCE(valor_total, 0)
                + ${quantidade}::numeric * ${valorUnitario}::numeric
            WHERE id = ${compraId}
              AND usuario_id = ${usuarioId}
            RETURNING id
        ),
        item_criado AS (
            INSERT INTO item (
                compra_id,
                nome_item,
                quantidade,
                unidade_de_medida,
                valor_unitario,
                validade_estimada
            )
            SELECT
                c.id,
                ${nomeItem},
                ${quantidade},
                ${unidadeDeMedida},
                ${valorUnitario},
                ${validadeEstimada}
            FROM compra_atualizada AS c
            RETURNING id, compra_id, quantidade
        ),
        estoque_criado AS (
            INSERT INTO estoque (
                usuario_id,
                item_id,
                quantidade_disponivel
            )
            SELECT
                ${usuarioId},
                i.id,
                i.quantidade
            FROM item_criado AS i
            RETURNING id, item_id
        )
        SELECT
            c.id AS "compraId",
            i.id AS "idItem",
            e.id AS "idEstoque"
        FROM compra_atualizada AS c
        JOIN item_criado AS i ON i.compra_id = c.id
        JOIN estoque_criado AS e ON e.item_id = i.id
    `;

    if (!resultado) {
        throw new Error('Compra não encontrada para este usuário');
    }

    return resultado;
}
// =============================================================================

module.exports = { buscarItens, buscarPorId, atualizarPorId, apagarPorId, criarItem, buscarItensPorUsuario};
