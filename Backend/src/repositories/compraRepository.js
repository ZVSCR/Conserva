const sql = require('../config/database');
const pool = require('../config/transactionDatabase');
const { quantidadeRepresentavel } = require('../services/granularidadeService');

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

class GranularidadeInvalidaError extends Error {
    constructor(message) {
        super(message);
        this.name = 'GranularidadeInvalidaError';
    }
}

class ItemCompraConflitoError extends Error {
    constructor() {
        super('A quantidade original só pode ser corrigida antes do consumo do item.');
        this.name = 'ItemCompraConflitoError';
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
            item.tipo_medida,
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
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows: [atual] } = await client.query(`
            SELECT i.*, e.id AS estoque_id, e.quantidade_disponivel
            FROM item i
            JOIN estoque e ON e.item_id = i.id
            WHERE i.id = $1 AND i.compra_id = $2
            FOR UPDATE OF i, e
        `, [itemId, compraId]);

        if (!atual) throw new ItemCompraNaoEncontradoError();

        const quantidade = fieldsToUpdate.quantidade ?? Number(atual.quantidade);
        const unidade = fieldsToUpdate.unidade_de_medida ?? atual.unidade_de_medida;
        const medidaValida = atual.tipo_medida === 'unitaria'
            ? unidade === 'un' && Number.isSafeInteger(quantidade) && quantidade > 0 &&
              quantidadeRepresentavel(quantidade)
            : ['kg', 'g', 'L', 'mL'].includes(unidade) &&
              quantidadeRepresentavel(quantidade) && quantidade > 0;

        if (!medidaValida) {
            throw new GranularidadeInvalidaError('Quantidade ou unidade incompatível com o tipo do item.');
        }

        if (unidade !== atual.unidade_de_medida &&
            (fieldsToUpdate.quantidade === undefined || fieldsToUpdate.valor_unitario === undefined)) {
            throw new GranularidadeInvalidaError(
                'Ao trocar a unidade, informe também a quantidade e o preço na nova unidade.'
            );
        }

        const alterouMedida = quantidade !== Number(atual.quantidade) || unidade !== atual.unidade_de_medida;
        if (alterouMedida && Number(atual.quantidade_disponivel) !== Number(atual.quantidade)) {
            throw new ItemCompraConflitoError();
        }

        const deveAtualizarValidade = Object.prototype.hasOwnProperty.call(fieldsToUpdate, 'validade_estimada') &&
            fieldsToUpdate.validade_estimada !== undefined;
        const { rows: [item] } = await client.query(`
            UPDATE item
            SET quantidade = $1,
                unidade_de_medida = $2,
                valor_unitario = COALESCE($3, valor_unitario),
                nome_item = COALESCE($4, nome_item),
                validade_estimada = CASE WHEN $5 THEN $6 ELSE validade_estimada END
            WHERE id = $7 AND compra_id = $8
            RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, tipo_medida, validade_estimada
        `, [
            quantidade, unidade, fieldsToUpdate.valor_unitario ?? null,
            fieldsToUpdate.nome_item ?? null, deveAtualizarValidade,
            fieldsToUpdate.validade_estimada ?? null, itemId, compraId
        ]);

        let estoque = {
            id: atual.estoque_id,
            quantidade_disponivel: atual.quantidade_disponivel
        };
        if (alterouMedida) {
            const { rows: [estoqueAtualizado] } = await client.query(`
                UPDATE estoque
                SET quantidade_disponivel = $1
                WHERE item_id = $2
                RETURNING id, quantidade_disponivel
            `, [quantidade, itemId]);
            estoque = estoqueAtualizado;
        }

        const { rows: [compra] } = await client.query(`
            UPDATE compra
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
                FROM item WHERE compra_id = $1
            )
            WHERE id = $1
            RETURNING id, valor_total
        `, [compraId]);

        await client.query('COMMIT');
        return { item, compra, estoque };
    } catch (erro) {
        await client.query('ROLLBACK');
        throw erro;
    } finally {
        client.release();
    }
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
                    INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, tipo_medida, valor_unitario, validade_estimada)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    RETURNING id
                `,
                [
                    compraId,
                    item.nome_item,
                    item.quantidade,
                    item.unidade_de_medida,
                    item.tipo_medida,
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
    // Cada embalagem pode ter um saldo próprio; a edição coletiva altera só dados compartilhados.
    const allowedBulkFields = ['nome_item', 'valor_unitario', 'validade_estimada'];
    const unsupportedFields = Object.keys(fieldsToUpdate).filter((field) =>
        !allowedBulkFields.includes(field)
    );

    if (unsupportedFields.length > 0) {
        throw new GranularidadeInvalidaError(
            'A atualização coletiva permite apenas nome_item, valor_unitario e validade_estimada.'
        );
    }

    const updates = fieldsToUpdate;

    const deveAtualizarValidade = updates.validade_estimada !== undefined;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const { rows: itensAtualizados } = await client.query(`
            UPDATE item
            SET
                valor_unitario = COALESCE($1, valor_unitario),
                nome_item = COALESCE($2, nome_item),
                validade_estimada = CASE
                    WHEN $3 THEN $4
                    ELSE validade_estimada
                END
            WHERE compra_id = $5
              AND nome_item = $6
              AND quantidade = $7
              AND unidade_de_medida = $8
              AND valor_unitario = $9
              AND validade_estimada IS NOT DISTINCT FROM $10
            RETURNING id, quantidade, valor_unitario, nome_item, unidade_de_medida, tipo_medida, validade_estimada;
        `, [
            updates.valor_unitario ?? null,
            updates.nome_item ?? null,
            deveAtualizarValidade,
            updates.validade_estimada ?? null,
            compraId,
            itemBusca.nome_item,
            itemBusca.quantidade,
            itemBusca.unidade_de_medida,
            itemBusca.valor_unitario,
            itemBusca.validade_estimada ?? null
        ]);

        if (itensAtualizados.length === 0) {
            throw new ItemCompraNaoEncontradoError();
        }

        const { rows: [compraAtualizada] } = await client.query(`
            UPDATE compra
            SET valor_total = (
                SELECT COALESCE(SUM(quantidade * valor_unitario), 0)
                FROM item
                WHERE compra_id = $1
            )
            WHERE id = $1
            RETURNING id, valor_total;
        `, [compraId]);

        await client.query('COMMIT');
        return { itens: itensAtualizados, compra: compraAtualizada };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
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
                INSERT INTO item (compra_id, nome_item, quantidade, unidade_de_medida, tipo_medida, valor_unitario, validade_estimada)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id              
                `,
                [
                    compraId,
                    item.nome_item,
                    item.quantidade,
                    item.unidade_de_medida,
                    item.tipo_medida,
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
    GranularidadeInvalidaError,
    ItemCompraConflitoError,
    apagarCompraPorId,
    adicionaItensACompraRepo
};
