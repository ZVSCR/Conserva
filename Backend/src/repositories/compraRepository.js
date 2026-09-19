
async function atualizarPorCompraId(itemId, compraId, fieldsToUpdate) {
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
        WHERE id = ${itemId} AND compra_id = ${compraId}
        RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada;
    `;
    return result[0];

}

module.exports = { atualizarPorCompraId };