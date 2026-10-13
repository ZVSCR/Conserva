const {
    createReceitaRepo,
    getGastoPorReceitaRepo,
    getGastoReceitaRepo
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

// Lista o gasto acumulado de cada receita
async function getGastoPorReceitaService({ usuarioId } = {}) {

    return getGastoPorReceitaRepo({ usuarioId });
}

// Retorna o gasto de uma receita com o detalhe de cada preparo.
// Retorna null se a receita não existe.
async function getGastoReceitaService({ receitaId, usuarioId } = {}) {

    const resultado = await getGastoReceitaRepo({ receitaId, usuarioId });

    if (!resultado) {
        return null;
    }

    const { receita, preparos } = resultado;

    // Soma em centavos para evitar erro de ponto flutuante
    const totalCentavos = preparos.reduce(
        (acc, preparo) => acc + Math.round(preparo.gasto * 100),
        0
    );

    return {
        id: receita.id,
        nome: receita.nome,
        vezes_preparada: preparos.length,
        gasto_total: totalCentavos / 100,
        preparos
    };
}

module.exports = {
    createReceitaService,
    getGastoPorReceitaService,
    getGastoReceitaService
};