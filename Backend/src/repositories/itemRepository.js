const sql = require('../config/database')

// =============================================================================
// LISTAGEM  -- Alterei pra ocultar a senha do usuario e mostrar o id dos itens
async function buscarItens() {
    const query = await sql`
        SELECT 
            item.id AS item_id,
            item.nome_item,
            item.quantidade,
            item.unidade_de_medida,
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
async function criarItem(usuarioId, nomeItem, quantidade, unidadeDeMedida, valorUnitario, validadeEstimada) {
    const valorTotal = quantidade * valorUnitario;

    // Como item depende de compra, gera uma compra pra cada item adicionado.
    // Quando a feature de compra estiver organizada, isso deve ser revisado.
    const resultadoCompra = await sql`
        INSERT INTO compra (usuario_id, valor_total, estabelecimento)
        VALUES (${usuarioId}, ${valorTotal}, 'Adição manual')
        RETURNING id
    `;
    const idCompra = resultadoCompra[0].id;

    const resultadoItem = await sql`
        INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada)
        VALUES (${idCompra}, ${nomeItem}, ${quantidade}, ${unidadeDeMedida}, ${valorUnitario}, ${validadeEstimada})
        RETURNING id
    `;
    const idItem = resultadoItem[0].id;

    const resultadoEstoque = await sql`
        INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
        VALUES (${usuarioId}, ${idItem}, ${quantidade})
        RETURNING id
    `;
    const idEstoque = resultadoEstoque[0].id;

    return { idCompra, idItem, idEstoque };
}
// =============================================================================

module.exports = { buscarItens, buscarPorId, atualizarPorId, apagarPorId, criarItem, buscarItensPorUsuario};
