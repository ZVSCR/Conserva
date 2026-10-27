const sql = require('../config/database');
const pool = require('../config/transactionDatabase');

const {
    identificarIngredienteCandidato
} = require('../services/ingredienteService');

class ReceitaNaoEncontradaError extends Error {
    constructor() {
        super('Receita não encontrada.');
        this.name = 'ReceitaNaoEncontradaError';
    }
}

class ReceitaSemIngredientesError extends Error {
    constructor() {
        super('A receita não tem ingredientes cadastrados.');
        this.name = 'ReceitaSemIngredientesError';
    }
}

class IngredientesInsuficientesError extends Error {
    constructor(faltando) {
        super('Estoque insuficiente para preparar a receita.');
        this.name = 'IngredientesInsuficientesError';
        this.faltando = faltando;
    }
}

// Cuida da inserção SQL de uma nova receita
async function createReceitaRepo(payload) {

    const {
        usuario_id,
        nome,
        descricao,
        modo_preparo,
        ingredientes
    } = payload;

    if (!Array.isArray(ingredientes) || ingredientes.length === 0) {
        throw new TypeError('A receita deve conter pelo menos um ingrediente.');
    }

    // Mapei ingredientes e seus atributos, convertendo aliases para 
    // o nome canônico, e mantendo somente a primeira ocorrência, pois 
    // receita_ingrediente admite um vínculo por ingrediente.

    const ingredientesUnicos = new Map();
    for (const ingrediente of ingredientes) {
        const nomeCanonico = identificarIngredienteCandidato(ingrediente.nome).nome;
        if (!ingredientesUnicos.has(nomeCanonico)) {
            ingredientesUnicos.set(nomeCanonico, {
                quantidade: ingrediente.quantidade,
                unidade_de_medida: ingrediente.unidade_de_medida
            });
        }
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: [receitaCriada] } = await client.query(`
            INSERT INTO receita (usuario_id, nome, descricao, modo_preparo)
            VALUES ($1, $2, $3, $4)
            RETURNING id
        `, [usuario_id, nome, descricao, modo_preparo]);

        if (!receitaCriada) {

            throw new Error('Falha ao criar receita: nenhum registro retornado.');
        }

        for (const [nomeIngrediente, dados] of ingredientesUnicos) {

            let { rows: [ingrediente] } = await client.query(`
                SELECT id
                FROM ingrediente
                WHERE nome = $1
            `, [nomeIngrediente]);

            if (!ingrediente) {

                ({ rows: [ingrediente] } = await client.query(`
                    INSERT INTO ingrediente (nome)
                    VALUES ($1)
                    ON CONFLICT (nome) DO NOTHING
                    RETURNING id
                `, [nomeIngrediente]));

                // Caso de concorrência:
                // Outra transação pode ter criado o mesmo ingrediente depois
                // da consulta inicial. Nesse caso, reutiliza o registro criado.

                if (!ingrediente) {

                    ({ rows: [ingrediente] } = await client.query(`
                        SELECT id
                        FROM ingrediente
                        WHERE nome = $1
                    `, [nomeIngrediente]));
                }
            }

            if (!ingrediente) {

                throw new Error(`Falha ao localizar ou criar ingrediente: ${nomeIngrediente}.`);
            }

            await client.query(`
                INSERT INTO receita_ingrediente
                    (receita_id, ingrediente_id, quantidade, unidade_de_medida)
                VALUES ($1, $2, $3, $4)
            `, [
                receitaCriada.id,
                ingrediente.id,
                dados.quantidade,
                dados.unidade_de_medida
            ]);
        }

        await client.query('COMMIT');
        return { id: receitaCriada.id };

    } catch (error) {
        try {

            await client.query('ROLLBACK');
        } catch (rollbackError) {

            console.error('Falha no rollback de createReceitaRepo:', rollbackError);
        }
        console.error('Erro em createReceitaRepo:', error);
        throw error;

    } finally {

        client.release();
    }
}

// Fragmento SQL com o gasto de uma preparação:
// quantidade gasta do estoque × valor unitário do item comprado
// (ambos na unidade do item, então não há conversão de medida)

// Lista todas as receitas com quantidade de preparos e gasto total acumulado.
// Receitas nunca preparadas aparecem com gasto 0.
async function getGastoPorReceitaRepo({ usuarioId }) {

    try {

        return await sql`
            SELECT
                r.id,
                r.nome,
                COUNT(DISTINCT rp.id)::int AS vezes_preparada,
                ROUND(COALESCE(SUM(rpe.quantidade_gasta * i.valor_unitario), 0), 2)::float8 AS gasto_total
            FROM receita r
            LEFT JOIN receita_preparada rp
                ON rp.receita_id = r.id AND rp.usuario_id = ${usuarioId}
            LEFT JOIN receita_preparada_estoque rpe
                ON rpe.receita_preparada_id = rp.id
            LEFT JOIN estoque e
                ON e.id = rpe.estoque_id
            LEFT JOIN item i
                ON i.id = e.item_id
            WHERE r.usuario_id IS NULL OR r.usuario_id = ${usuarioId}
            GROUP BY r.id, r.nome
            ORDER BY r.nome
        `;
    } catch (error) {
        console.error('Erro em getGastoPorReceitaRepo:', error);
        throw error;
    }
}
// simular = true: Confere e devolve o plano, sem gravar nada ainda. Apenas para ver se é possível fazer a receita
async function prepararReceitaRepo(usuarioId, receitaId, planejar, { simular = false } = {}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: [receita] } = await client.query(
            'SELECT id FROM receita WHERE id = $1 AND (usuario_id IS NULL OR usuario_id = $2)', [receitaId, usuarioId]
        );
        if (!receita) throw new ReceitaNaoEncontradaError();

        const { rows: ingredientes } = await client.query(`
            SELECT ri.ingrediente_id, ing.nome, ri.quantidade, ri.unidade_de_medida
            FROM receita_ingrediente ri
            JOIN ingrediente ing ON ing.id = ri.ingrediente_id
            WHERE ri.receita_id = $1
        `, [receitaId]);
        if (ingredientes.length === 0) throw new ReceitaSemIngredientesError();

        // Lotes do usuário, já na ordem de prioridade: abertos primeiro,
        // depois o que vence antes. FOR UPDATE trava as linhas até o fim da transação.
        const { rows: lotes } = await client.query(`
            SELECT it.ingrediente_id, e.id AS estoque_id, e.quantidade_disponivel,
                   it.unidade_de_medida, it.tipo_medida
            FROM estoque e
            JOIN item it ON it.id = e.item_id
            WHERE e.usuario_id = $1
              AND it.ingrediente_id = ANY($2::int[])
              AND e.quantidade_disponivel > 0
            ORDER BY e.gasto DESC, it.validade_estimada ASC NULLS LAST, e.id
            FOR UPDATE OF e
        `, [usuarioId, ingredientes.map((i) => i.ingrediente_id)]);

        const plano = planejar(ingredientes, lotes);

        if (simular) {
            await client.query('ROLLBACK');
            return plano;
        }
        if (!plano.ok) throw new IngredientesInsuficientesError(plano.faltando);

        const { rows: [preparada] } = await client.query(`
            INSERT INTO receita_preparada (usuario_id, receita_id)
            VALUES ($1, $2)
            RETURNING id, data_preparo
        `, [usuarioId, receitaId]);

        for (const uso of plano.usos) {
            await client.query(`
                UPDATE estoque
                SET quantidade_disponivel = quantidade_disponivel - $1
                WHERE id = $2
            `, [uso.quantidade_gasta, uso.estoque_id]);

            await client.query(`
                INSERT INTO receita_preparada_estoque (receita_preparada_id, estoque_id, quantidade_gasta)
                VALUES ($1, $2, $3)
            `, [preparada.id, uso.estoque_id, uso.quantidade_gasta]);
        }

        await client.query('COMMIT');
        return {
            receita_preparada_id: preparada.id,
            data_preparo: preparada.data_preparo,
            usos: plano.usos
        };
    } catch (erro) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('Falha no rollback:', rollbackErr);
        }
        throw erro;
    } finally {
        client.release();
    }
}
// Lista receitas do sistema (por enquanto NULL) e do usuário, cada uma com seus ingredientes
async function listReceitasRepo(usuarioId) {
    try {
        const receitas = await sql`
            SELECT
                r.id,
                r.nome,
                r.descricao,
                r.modo_preparo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nome', i.nome,
                            'quantidade', ri.quantidade,
                            'unidade_de_medida', ri.unidade_de_medida
                        )
                        ORDER BY i.nome
                    ) FILTER (WHERE i.id IS NOT NULL),
                    '[]'
                ) AS ingredientes
            FROM receita r
            LEFT JOIN receita_ingrediente ri ON ri.receita_id = r.id
            LEFT JOIN ingrediente i ON i.id = ri.ingrediente_id
            WHERE r.usuario_id IS NULL OR r.usuario_id = ${usuarioId}
            GROUP BY r.id
            ORDER BY r.nome
        `;

        return receitas;
    } catch (error) {
        console.error('Erro em listReceitasRepo:', error);
        throw error;
    }
}

// Retorna o gasto de uma receita, detalhado por preparo.
// Retorna null se a receita não existe ou não está visível ao usuário.
async function getGastoReceitaRepo({ receitaId, usuarioId }) {

    try {

        const [receita] = await sql`
            SELECT id, nome
            FROM receita
            WHERE id = ${receitaId} AND (usuario_id IS NULL OR usuario_id = ${usuarioId})
        `;

        if (!receita) {
            return null;
        }

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
            WHERE rp.receita_id = ${receitaId} AND rp.usuario_id = ${usuarioId}
            GROUP BY rp.id
            ORDER BY rp.data_preparo DESC
        `;

        return { receita, preparos };
    } catch (error) {
        console.error('Erro em getGastoReceitaRepo:', error);
        throw error;
    }
}

// Busca uma receita pelo id, com seus ingredientes
async function getReceitaByIdRepo(id, usuarioId) {
    try {
        const [receita] = await sql`
            SELECT
                r.id,
                r.nome,
                r.descricao,
                r.modo_preparo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nome', i.nome,
                            'quantidade', ri.quantidade,
                            'unidade_de_medida', ri.unidade_de_medida
                        )
                        ORDER BY i.nome
                    ) FILTER (WHERE i.id IS NOT NULL),
                    '[]'
                ) AS ingredientes
            FROM receita r
            LEFT JOIN receita_ingrediente ri ON ri.receita_id = r.id
            LEFT JOIN ingrediente i ON i.id = ri.ingrediente_id
            WHERE r.id = ${id} AND (r.usuario_id IS NULL OR r.usuario_id = ${usuarioId})
            GROUP BY r.id
        `;

        return receita;
    } catch (error) {
        console.error('Erro em getReceitaByIdRepo:', error);
        throw error;
    }
}

// Remove uma receita pelo id (receita_ingrediente é removida em cascata)
async function apagarReceitaPorId(usuarioId, receitaId) {
    const [receitaRemovida] = await sql`
        DELETE FROM receita
        WHERE id = ${receitaId} AND usuario_id = ${usuarioId}
        RETURNING id, nome;
    `;

    if (!receitaRemovida) {
        throw new ReceitaNaoEncontradaError();
    }

    return receitaRemovida;
}

async function updateReceitaRepo(receitaId, payload, usuarioId) {
    const {
        nome,
        descricao,
        modo_preparo
    } = payload;

    try {
        const [receitaAtualizada] = await sql`
            UPDATE receita
            SET
                nome = ${nome},
                descricao = ${descricao},
                modo_preparo = ${modo_preparo}
            WHERE id = ${receitaId} AND usuario_id = ${usuarioId}
            RETURNING id, nome, descricao, modo_preparo;
        `;

        return receitaAtualizada;
    } catch (error) {
        console.error('Erro em updateReceitaRepo: ', error);
        throw error;
    }
}

async function listarPreparosPorUsuario(usuarioId) {
    return sql`
        SELECT rp.id, rp.receita_id, rp.data_preparo, r.nome, r.descricao, r.modo_preparo,
               ROUND(COALESCE(SUM(rpe.quantidade_gasta * i.valor_unitario), 0), 2)::float8 AS custo
        FROM receita_preparada rp
        JOIN receita r ON r.id = rp.receita_id
        LEFT JOIN receita_preparada_estoque rpe ON rpe.receita_preparada_id = rp.id
        LEFT JOIN estoque e ON e.id = rpe.estoque_id
        LEFT JOIN item i ON i.id = e.item_id
        WHERE rp.usuario_id = ${usuarioId}
        GROUP BY rp.id, r.id
        ORDER BY rp.data_preparo DESC, rp.id DESC
    `;
}

module.exports = {
    createReceitaRepo,
    prepararReceitaRepo,
    ReceitaNaoEncontradaError,
    ReceitaSemIngredientesError,
    IngredientesInsuficientesError,
    listReceitasRepo,
    getReceitaByIdRepo,
    apagarReceitaPorId,
    updateReceitaRepo,
    getGastoPorReceitaRepo,
    getGastoReceitaRepo,
    listarPreparosPorUsuario,
};
