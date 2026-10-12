const {
    createReceitaRepo,
    updateReceitaRepo,
} = require('../repositories/receitaRepository');

// Recebe o payload validado, normaliza o nome e envia para inserção SQL
async function createReceitaService(payload) {

    const {
        nome,
        descricao,
        modo_preparo
    } = payload;

    const normalizedNome = nome.trim();

    return createReceitaRepo({
        nome: normalizedNome,
        descricao,
        modo_preparo
    });
}

async function updateReceitaService(receitaId, payload) {
    const {
        nome,
        descricao,
        modo_preparo
    } = payload;
    
    const normalizedNome = nome.trim();
    return updateReceitaRepo(
        receitaId,
        {
            nome: normalizedNome,
            descricao,
            modo_preparo
        },
    );
}

module.exports = {
    createReceitaService,
    updateReceitaService,
};