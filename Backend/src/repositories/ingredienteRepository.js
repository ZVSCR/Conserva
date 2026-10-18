const pool = require('../config/transactionDatabase');

async function inserirIngredientesPadrao(nomes) {
    if (!Array.isArray(nomes) || nomes.length === 0 ||
        nomes.some((nome) => typeof nome !== 'string' || !nome.trim())) {
        throw new TypeError('Informe nomes de ingredientes para a carga inicial.');
    }

    const { rows } = await pool.query(`
        INSERT INTO ingrediente (nome)
        SELECT DISTINCT nome
        FROM unnest($1::text[]) AS nomes(nome)
        ON CONFLICT (nome) DO NOTHING
        RETURNING id
    `, [nomes]);

    return rows.length;
}

async function buscarIdsIngredientes(client, nomes) {
    if (nomes.length === 0) return new Map();

    const { rows } = await client.query(`
        SELECT id, nome
        FROM ingrediente
        WHERE nome = ANY($1::text[])
    `, [nomes]);

    const idsPorNome = new Map(rows.map(({ nome, id }) => [nome, id]));
    const ausente = nomes.find((nome) => !idsPorNome.has(nome));
    if (ausente) {
        throw new Error(`Ingrediente padrão ausente no banco: ${ausente}.`);
    }

    return idsPorNome;
}

module.exports = { inserirIngredientesPadrao, buscarIdsIngredientes };
