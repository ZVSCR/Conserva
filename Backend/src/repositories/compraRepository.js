const sql = require('../config/database')

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

    const [itensAtualizados, comprasAtualizadas] = await sql.transaction((transactionSql) => [
        transactionSql`
            UPDATE item
            SET 
                quantidade = COALESCE(${updates.quantidade ?? null}, quantidade),
                valor_unitario = COALESCE(${updates.valor_unitario ?? null}, valor_unitario),
                nome_item = COALESCE(${updates.nome_item ?? null}, nome_item),
                unidade_de_medida = COALESCE(${updates.unidade_de_medida ?? null}, unidade_de_medida),
                validade_estimada = COALESCE(${updates.validade_estimada ?? null}, validade_estimada)
            WHERE id = ${itemId} AND compra_id = ${compraId}
            RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, validade_estimada;
        `,
        transactionSql`
            UPDATE compra
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
                FROM item
                WHERE compra_id = ${compraId}
            )
            WHERE id = ${compraId}
              AND EXISTS (
                  SELECT 1
                  FROM item
                  WHERE id = ${itemId} AND compra_id = ${compraId}
              )
            RETURNING id, valor_total;
        `
    ]);

    const itemAtualizado = itensAtualizados[0];

    if (!itemAtualizado) {
        throw new Error('Item não encontrado para essa compra.');
    }

    const compraAtualizada = comprasAtualizadas[0];

    return { item: itemAtualizado, compra: compraAtualizada };

}

module.exports = { atualizarPorCompraId };
