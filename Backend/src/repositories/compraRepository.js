const sql = require('../config/database')

class ItemCompraNaoEncontradoError extends Error {
    constructor() {
        super('Item não encontrado para essa compra.');
        this.name = 'ItemCompraNaoEncontradoError';
    }
}

class CompraNaoEncontradaError extends Error {
    constructor() {
        super('Compra não encontrada.');
        this.name = 'CompraNaoEncontradaError';
    }
}

// =============================================================================
// LISTAGEM
async function listarComprasUsuario(usuarioId) {
    const compras = await sql`
        SELECT
            compra.*,
            item.id AS item_id,
            item.nome_item,
            item.quantidade,
            item.unidade_de_medida,
            item.valor_unitario,
            item.validade_estimada,
            users.username
        FROM compra
        JOIN item ON compra.id = item.compra_id
        JOIN users ON compra.usuario_id = users.id
        WHERE users.id = ${usuarioId}
        ORDER BY compra.id, item.id
    `;

    return compras;
}

async function listarCompraPorId(usuarioId, compraId) {
    const itens = await sql`
        SELECT 
            compra.*,
            item.id AS item_id,
            item.nome_item,
            item.quantidade,
            item.unidade_de_medida,
            item.valor_unitario,
            item.validade_estimada,
            users.username
        FROM compra
        JOIN item ON compra.id = item.compra_id
        JOIN users ON compra.usuario_id = users.id
        WHERE users.id = ${usuarioId} AND item.compra_id = ${compraId}
        ORDER BY item.id
    `;

    if (items.length === 0) throw new CompraNaoEncontradaError();

    return itens;
}
// =============================================================================

async function atualizarCompraPorId(compraId, fieldsToUpdate) {
    const deveAtualizarData = fieldsToUpdate.data_compra !== undefined;
    const deveAtualizarEstabelecimento =
        fieldsToUpdate.estabelecimento !== undefined;

    const [compraAtualizada] = await sql`
        UPDATE compra
        SET
            data_compra = CASE
                WHEN ${deveAtualizarData} THEN ${fieldsToUpdate.data_compra ?? null}
                ELSE data_compra
            END,
            estabelecimento = CASE
                WHEN ${deveAtualizarEstabelecimento} THEN ${fieldsToUpdate.estabelecimento ?? null}
                ELSE estabelecimento
            END
        WHERE id = ${compraId}
        RETURNING id, usuario_id, data_compra, valor_total, estabelecimento;
    `;

    if (!compraAtualizada) {
        throw new CompraNaoEncontradaError();
    }

    return compraAtualizada;
}

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

    const deveAtualizarValidade = Object.prototype.hasOwnProperty.call(
        updates,
        'validade_estimada'
    );

    const [itensAtualizados, comprasAtualizadas] = await sql.transaction((transactionSql) => [
        transactionSql`
            UPDATE item
            SET 
                quantidade = COALESCE(${updates.quantidade ?? null}, quantidade),
                valor_unitario = COALESCE(${updates.valor_unitario ?? null}, valor_unitario),
                nome_item = COALESCE(${updates.nome_item ?? null}, nome_item),
                unidade_de_medida = COALESCE(${updates.unidade_de_medida ?? null}, unidade_de_medida),
                validade_estimada = CASE
                    WHEN ${deveAtualizarValidade} THEN ${updates.validade_estimada ?? null}
                    ELSE validade_estimada
                END
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
        throw new ItemCompraNaoEncontradoError();
    }

    const compraAtualizada = comprasAtualizadas[0];

    return { item: itemAtualizado, compra: compraAtualizada };

}

module.exports = {
    listarComprasUsuario,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError
};
