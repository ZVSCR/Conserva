const pool = require('../config/transactionDatabase');
const sql = require('../config/database');

// A API cria um ingrediente novo; duplicatas são tratadas como conflito pelo controlador.
async function createIngredienteRepo(nome) {
    const [ingrediente] = await sql`
        INSERT INTO ingrediente (nome)
        VALUES (${nome})
        RETURNING id, nome
    `;
    return ingrediente;
}

async function updateIngredienteRepo(ingredienteId, nome) {
    const [ingrediente] = await sql`
        UPDATE ingrediente
        SET nome = ${nome}
        WHERE id = ${ingredienteId}
        RETURNING id, nome
    `;
    return ingrediente;
}

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

async function buscarIdsIngredientes(client, nomes, nomesObrigatorios = nomes) {
    if (nomes.length === 0) return new Map();

    const { rows } = await client.query(`
        SELECT id, nome
        FROM ingrediente
        WHERE nome = ANY($1::text[])
    `, [nomes]);

    const idsPorNome = new Map(rows.map(({ nome, id }) => [nome, id]));
    const ausente = nomesObrigatorios.find((nome) => !idsPorNome.has(nome));
    if (ausente) {
        throw new Error(`Ingrediente padrão ausente no banco: ${ausente}.`);
    }

    return idsPorNome;
}

module.exports = { createIngredienteRepo, updateIngredienteRepo, inserirIngredientesPadrao, buscarIdsIngredientes };
