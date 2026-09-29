const Decimal = require('decimal.js');
const sql = require('../config/database');
const pool = require('../config/transactionDatabase');

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
            COUNT(item.id) AS quantidade_itens
        FROM compra
        JOIN item ON compra.id = item.compra_id
        JOIN users ON compra.usuario_id = users.id
        WHERE users.id = ${usuarioId}
        GROUP BY compra.id
        ORDER BY compra.id
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

    if (itens.length === 0) throw new CompraNaoEncontradaError();

    return itens;
}

async function listarComprasUsuarioData(usuarioId, dataInicio, dataFim) {
    const compras = await sql`
        SELECT
            c.id,
            c.data_compra,
            c.valor_total,
            c.estabelecimento,
            c.usuario_id,
            COUNT(i.id) AS quantidade_itens
        FROM compra c
        LEFT JOIN item i ON c.id = i.compra_id
        WHERE c.usuario_id = ${usuarioId}
          ${dataInicio && dataFim ? sql`AND c.data_compra BETWEEN ${dataInicio} AND${dataFim}` : sql``}
        GROUP BY c.id, c.data_compra, c.valor_total, c.estabelecimento, c.usuario_id
        ORDER BY c.data_compra DESC
    `;

    return compras;
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

    // Captura a quantidade atual antes de sobrescrever
    const [itemAntigo] = await sql`
        SELECT quantidade FROM item WHERE id = ${itemId} AND compra_id = ${compraId}
    `;

    if (!itemAntigo) {
        throw new ItemCompraNaoEncontradoError();
    }

    const quantidadeAntiga = Number(itemAntigo.quantidade);
    const novaQuantidade = updates.quantidade ?? quantidadeAntiga;
    const delta = novaQuantidade - quantidadeAntiga;

    const [itensAtualizados, comprasAtualizadas, estoqueAtualizado] = await sql.transaction((transactionSql) => [
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
        `,
        // Propaga o delta pro estoque
        transactionSql`
            UPDATE estoque
            SET quantidade_disponivel = quantidade_disponivel + ${delta}
            WHERE item_id = ${itemId}
            RETURNING id, quantidade_disponivel;
        `
    ]);

    const itemAtualizado = itensAtualizados[0];

    if (!itemAtualizado) {
        throw new ItemCompraNaoEncontradoError();
    }

    const compraAtualizada = comprasAtualizadas[0];

    return { item: itemAtualizado, compra: compraAtualizada, estoque: estoqueAtualizado[0] };
}

async function apagarCompraPorId(usuarioId, compraId) {
    const [compraRemovida] = await sql`
        DELETE FROM compra
        WHERE id = ${compraId} AND usuario_id = ${usuarioId}
        RETURNING id, data_compra, valor_total, estabelecimento;
    `;

    if (!compraRemovida) {
        throw new CompraNaoEncontradaError();
    }

    return compraRemovida;
}

async function createCompraVazia(usuarioId, data_compra, estabelecimento) {
    const [resultado] = await sql`
        INSERT INTO compra (usuario_id, data_compra, valor_total, estabelecimento)
        VALUES (${usuarioId}, COALESCE(${data_compra ?? null}, CURRENT_TIMESTAMP), 0, ${estabelecimento})
        RETURNING id
    `
    if (!resultado) {
        throw new Error('Erro na criação de compra');
    }
    return resultado;
}

async function createCompraRepo(dadosCompra) {
    const {
        usuario_id,
        data_compra,
        estabelecimento,
        valor_total,
        itens,
    } = dadosCompra;

    const client = await pool.connect();

    try {

        await client.query('BEGIN');

        // Cria registro de compra
        let compraId;
        if (data_compra == undefined) {
            // Se data não foi informada, banco de dados usa DEFAULT
            const {
                rows: [{ id: compraIdBranch }],
            } = await client.query(`
                INSERT INTO compra (usuario_id, valor_total, estabelecimento)
                VALUES ($1, $2, $3) 
                RETURNING id 
                `,
                [
                    usuario_id,
                    valor_total,
                    estabelecimento
                ]
            );

            compraId = compraIdBranch;
        } else {
            // Se data de compra foi informada, o banco usa a data informada
            const {
                rows: [{ id: compraIdBranch }],
            } = await client.query(`
                INSERT INTO compra (usuario_id, data_compra, valor_total, estabelecimento)
                VALUES ($1, $2, $3, $4)
                RETURNING id
                `,
                [
                    usuario_id,
                    data_compra,
                    valor_total,
                    estabelecimento
                ]
            );

            compraId = compraIdBranch;
        }

        for (const item of itens) {

            // Cria lotes para cada item
            const {
                rows: [{ id: itemId }],
            } = await client.query(`
                    INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `,
                [
                    compraId,
                    item.nome_item,
                    item.quantidade,
                    item.unidade_de_medida,
                    item.valor_unitario,
                    item.validade_estimada
                ]
            );

            // Insere lotes no estoque de usuário
            await client.query(`
                INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
                VALUES ($1, $2, $3)
                `,
                [
                    usuario_id,
                    itemId,
                    item.quantidade
                ]
            );
        }

        // Se tudo for bem sucedido, salva todas as operações
        await client.query('COMMIT');

        // Retorna o objeto de compra com o ID criado
        return { id: compraId };
    } catch (err) {

        // Erro detectado, desfaz todas as operações
        await client.query('ROLLBACK');
        throw err;
    } finally {

        client.release();
    }
}

async function atualizarInstanciasPorCompraId(compraId, itemBusca, fieldsToUpdate) {
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

    const quantidadeInformada = updates.quantidade ?? null;

    const [itensAtualizados, comprasAtualizadas] = await sql.transaction((transactionSql) => [
        transactionSql`
            WITH alvo AS (
                SELECT id
                FROM item
                WHERE compra_id = ${compraId}
                  AND nome_item = ${itemBusca.nome_item}
                  AND quantidade = ${itemBusca.quantidade}
                  AND valor_unitario = ${itemBusca.valor_unitario}
                  AND validade_estimada IS NOT DISTINCT FROM ${itemBusca.validade_estimada ?? null}
            ),
            contagem AS (
                SELECT COUNT(*)::numeric AS total FROM alvo
            )
            UPDATE item
            SET 
                quantidade = COALESCE(
                    ${quantidadeInformada} / NULLIF(contagem.total, 0),
                    item.quantidade
                ),
                valor_unitario = COALESCE(${updates.valor_unitario ?? null}, valor_unitario),
                nome_item = COALESCE(${updates.nome_item ?? null}, nome_item),
                unidade_de_medida = COALESCE(${updates.unidade_de_medida ?? null}, unidade_de_medida),
                validade_estimada = CASE
                    WHEN ${deveAtualizarValidade} THEN ${updates.validade_estimada ?? null}
                    ELSE validade_estimada
                END
            WHERE compra_id = ${compraId}
              AND nome_item = ${itemBusca.nome_item}
              AND quantidade = ${itemBusca.quantidade}
              AND valor_unitario = ${itemBusca.valor_unitario}
              AND validade_estimada IS NOT DISTINCT FROM ${itemBusca.validade_estimada ?? null}
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
            RETURNING id, valor_total;
        `
    ]);

    if (itensAtualizados.length === 0) {
        throw new ItemCompraNaoEncontradoError();
    }

    const compraAtualizada = comprasAtualizadas[0];

    return { itens: itensAtualizados, compra: compraAtualizada };
}

// Função para obter valor total de uma compra a partir de seu ID
// async function getValorTotalCompra(compraId) {

//     const { rows } = await sql(`
//         SELECT valor_total
//         FROM compra
//         WHERE id = $1
//     `,
//         [compraId]
//     );

//     const valorTotal = new Decimal(rows[0].valor_total);

//     return valorTotal;
// }

async function adicionaItensACompraRepo(novosItens) {

    const {
        usuario_id,
        compra_id,
        valor_itens_novos,
        itens
    } = novosItens;

    const client = await pool.connect();

    try {

        // Inicia transação
        await client.query('BEGIN');

        // Atualiza o valor total da compra
        const { rows } = await client.query(`
            UPDATE compra
            SET valor_total = COALESCE(valor_total, 0) + $1
            WHERE id = $2 AND usuario_id = $3
            RETURNING id
            `,
            [
                valor_itens_novos,
                compra_id,
                usuario_id
            ]
        );

        // Compra não encontrada para o usuário
        if (rows.length === 0) {
            throw new Error('Compra não encontrada para este usuário');
        }

        const compraId = rows[0].id;

        for (const item of itens) {

            // Cria lotes para cada novo item
            const {
                rows: [{ id: itemId }],
            } = await client.query(`
                INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, valor_unitario, validade_estimada)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id              
                `,
                [
                    compraId,
                    item.nome_item,
                    item.quantidade,
                    item.unidade_de_medida,
                    item.valor_unitario,
                    item.validade_estimada
                ]
            );

            // Insere lotes no estoque de usuário
            await client.query(`
                INSERT INTO estoque (usuario_id, item_id, quantidade_disponivel)
                VALUES ($1, $2, $3)
                `,
                [
                    usuario_id,
                    itemId,
                    item.quantidade
                ]
            );
        }

        // Se tudo for bem sucedido, todas as operações acontecem
        await client.query('COMMIT');

        // Retorna objeto de compra com o ID atualizado
        return { id: compraId };

    } catch (err) {
        try {
            // Proteção de erro de rollback
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Falha no rollback:', rollbackErr);
        }
        throw err;
    } finally {
        client.release();
    }
}

module.exports = {
    listarComprasUsuario,
    listarComprasUsuarioData,
    listarCompraPorId,
    atualizarCompraPorId,
    atualizarPorCompraId,
    atualizarInstanciasPorCompraId,
    createCompraRepo,
    createCompraVazia,
    CompraNaoEncontradaError,
    ItemCompraNaoEncontradoError,
    apagarCompraPorId,
    adicionaItensACompraRepo
};
