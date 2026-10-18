const sql = require('../config/database');

// Insere um ingrediente global no catálogo
async function createIngredienteRepo(nome) {
    const [ingrediente] = await sql`
        INSERT INTO ingrediente (nome)
        VALUES (${nome})
        RETURNING id, nome
    `;

    return ingrediente;
}

module.exports = {
    createIngredienteRepo,
};