const sql = require('../config/database');

// Cuida da inserção SQL de uma nova receita
async function createReceitaRepo(payload) {

    const {
        nome,
        descricao,
        modo_preparo
    } = payload;

    try {

        const [receitaCriada] = await sql`
            INSERT INTO receita(nome, descricao, modo_preparo)
            VALUES (${nome}, ${descricao}, ${modo_preparo})
            RETURNING id
        `;

        if (!receitaCriada) {
            throw new Error('Falha ao criar receita: nenhum registro retornado.');
        }

        return { id: receitaCriada.id };
    } catch (error) {

        console.error('Erro em createReceitaRepo:', error);
        throw error;
    }
}

// Fragmento SQL com o gasto de uma preparação:
// quantidade gasta do estoque × valor unitário do item comprado
// (ambos na unidade do item, então não há conversão de medida)

// Lista todas as receitas com quantidade de preparos e gasto total acumulado.
// Receitas nunca preparadas aparecem com gasto 0. usuarioId é opcional.
async function getGastoPorReceitaRepo({ usuarioId } = {}) {

    try {

        const filtroUsuario = usuarioId
            ? sql`AND rp.usuario_id = ${usuarioId}`
            : sql``;

        return await sql`
            SELECT
                r.id,
                r.nome,
                COUNT(DISTINCT rp.id)::int AS vezes_preparada,
                ROUND(COALESCE(SUM(rpe.quantidade_gasta * i.valor_unitario), 0), 2)::float8 AS gasto_total
            FROM receita r
            LEFT JOIN receita_preparada rp
                ON rp.receita_id = r.id ${filtroUsuario}
            LEFT JOIN receita_preparada_estoque rpe
                ON rpe.receita_preparada_id = rp.id
            LEFT JOIN estoque e
                ON e.id = rpe.estoque_id
            LEFT JOIN item i
                ON i.id = e.item_id
            GROUP BY r.id, r.nome
            ORDER BY r.nome
        `;
    } catch (error) {

        console.error('Erro em getGastoPorReceitaRepo:', error);
        throw error;
    }
}

// Retorna o gasto de uma receita, detalhado por preparo.
// Retorna null se a receita não existe. usuarioId é opcional.
async function getGastoReceitaRepo({ receitaId, usuarioId } = {}) {

    try {

        const [receita] = await sql`
            SELECT id, nome
            FROM receita
            WHERE id = ${receitaId}
        `;

        if (!receita) {
            return null;
        }

        const filtroUsuario = usuarioId
            ? sql`AND rp.usuario_id = ${usuarioId}`
            : sql``;

        const preparos = await sql`
            SELECT
                rp.id AS receita_preparada_id,
                rp.usuario_id,
                rp.data_preparo,
                ROUND(COALESCE(SUM(rpe.quantidade_gasta * i.valor_unitario), 0), 2)::float8 AS gasto
            FROM receita_preparada rp
            LEFT JOIN receita_preparada_estoque rpe
                ON rpe.receita_preparada_id = rp.id
            LEFT JOIN estoque e
                ON e.id = rpe.estoque_id
            LEFT JOIN item i
                ON i.id = e.item_id
            WHERE rp.receita_id = ${receitaId} ${filtroUsuario}
            GROUP BY rp.id
            ORDER BY rp.data_preparo DESC
        `;

        return { receita, preparos };
    } catch (error) {

        console.error('Erro em getGastoReceitaRepo:', error);
        throw error;
    }
}

module.exports = {
    createReceitaRepo,
    getGastoPorReceitaRepo,
    getGastoReceitaRepo
};