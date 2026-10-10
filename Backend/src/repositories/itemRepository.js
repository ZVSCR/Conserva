const sql = require('../config/database')

const aliasesToNome = { 
    "req": "requeijao",
    "requeijao": "requeijao",
    "leite": "leite",
    "pao": "pao",
    "sal": "sal",
    "banana": "banana",
    "mamao": "mamao",
    "manteiga": "manteiga",
    "mant": "manteiga",
    "margarina": "margarina",
    "marg": "margarina",
    "queijo": "queijo",
    "qjo": "queijo",
    "qj": "queijo",
    "iogurte": "iogurte",
    "iog": "iogurte",
    "creme de leite": "creme de leite",
    "cr leite": "creme de leite",
    "leite condensado": "leite condensado",
    "lt cond": "leite condensado",
    "leite integral": "leite",
    "leite desnatado": "leite",
    "pao frances": "pao",
    "pao de forma": "pao de forma",
    "pao forma": "pao de forma",
    "farinha": "farinha de trigo",
    "far trigo": "farinha de trigo",
    "acucar": "acucar",
    "acuc": "acucar",
    "arroz": "arroz",
    "feijao": "feijao",
    "fj": "feijao",
    "macarrao": "macarrao",
    "macar.": "macarrao",
    "aveia": "aveia",
    "oleo": "oleo de soja",
    "azeite": "azeite de oliva",
    "az": "azeite de oliva",
    "vinagre": "vinagre",
    "pimenta do reino": "pimenta do reino",
    "pim reino": "pimenta do reino",
    "frango": "frango",
    "fgo": "frango",
    "carne bovina": "carne bovina",
    "carne": "carne bovina",
    "carne moida": "carne moida",
    "carne moída": "carne moida",
    "linguica": "linguica",
    "ling": "linguica",
    "bacon": "bacon",
    "peixe": "peixe",
    "maca": "maca",
    "maçã": "maca",
    "laranja": "laranja",
    "lar": "laranja",
    "uva": "uva",
    "abacaxi": "abacaxi",
    "abacax.": "abacaxi",
    "limao": "limao",
    "melancia": "melancia",
    "morango": "morango",
    "tomate": "tomate",
    "tom": "tomate",
    "cebola": "cebola",
    "ceb": "cebola",
    "alho": "alho",
    "batata": "batata",
    "bat": "batata",
    "cenoura": "cenoura",
    "cen": "cenoura",
    "alface": "alface",
    "pimentao": "pimentao",
    "cafe": "cafe",
    "café": "cafe",
    "suco": "suco",
    "refrigerante": "refrigerante",
    "refri": "refrigerante",
    "agua": "agua",
    "água": "agua",
    "cerveja": "cerveja",
    "cerv": "cerveja",
};

function normalizar(str) {
    return str
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,;:!?]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

const map = new Map(
    Object.entries(aliasesToNome).map(([alias, nome]) => [normalizar(alias), nome])
);

function parseItem(inputStr) {
    return normalizar(
        inputStr
            .toLowerCase()
            .replace(/\d+(?:[.,]\d+)?\s*(kg|un|g|ml|l)?\b/g, " ")
    );
}

function buscarNome(item) {
    const aliases = [...map.keys()].sort((a, b) => b.length - a.length);
    for (const alias of aliases) {
        const regex = new RegExp(`(^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`);
        if (regex.test(item)) return map.get(alias);
    }
    return null;
}

function adicionarItem(inputStr) {
    const item = parseItem(inputStr);
    if (!item) return { needsName: false, item: null };                 // Entrada vazia / só números

    const nome = buscarNome(item);
    if (!nome) {
        return { needsName: true, rawItem: item };
    }

    return { needsName: false, item: nome };
}

function resolverNomeItem(rawItem, novoItemNome) {
    let itemFinal = parseItem(novoItemNome);
    itemFinal = buscarNome(itemFinal) ?? itemFinal;                     // Usa nome padrão se o informado for um alias conhecido

    map.set(rawItem, itemFinal);                                        // Aprende o novo item para próximas vezes

    return { needsName: false, item: itemFinal };
}

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
