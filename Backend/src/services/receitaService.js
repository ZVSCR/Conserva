const {
    createReceitaRepo
} = require('../repositories/receitaRepository');

// Recebe o payload validado, normaliza o nome e envia para inserção SQL
async function createReceitaService(payload) {

    const {
        nome,
        descricao,
        modo_preparo
    } = payload;

    const normalizedNome = nome.trim().toLowerCase();

    return createReceitaRepo({
        nome: normalizedNome,
        descricao,
        modo_preparo
    });
}

module.exports = {
    createReceitaService
};