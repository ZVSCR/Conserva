const sql = require('../config/database');
const pool = require('../config/transactionDatabase');

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

// simular = true: Confere e devolve o plano, sem gravar nada ainda. Apenas para ver se é possível fazer a receita
async function prepararReceitaRepo(usuarioId, receitaId, planejar, { simular = false } = {}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows: [receita] } = await client.query(
            'SELECT id FROM receita WHERE id = $1', [receitaId]
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
                SET quantidade_disponivel = quantidade_disponivel - $1,
                    gasto = TRUE
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

module.exports = {
    createReceitaRepo, prepararReceitaRepo, ReceitaNaoEncontradaError, ReceitaSemIngredientesError, IngredientesInsuficientesError
};