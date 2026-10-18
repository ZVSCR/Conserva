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

module.exports = { inserirIngredientesPadrao };
