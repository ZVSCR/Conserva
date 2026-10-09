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

module.exports = {
    createReceitaRepo
};