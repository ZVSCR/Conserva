const {
    createReceitaRepo,
    getGastoPorReceitaRepo,
    getGastoReceitaRepo,
    updateReceitaRepo,
    inserirIngredienteReceitaRepo,
    removerIngredienteReceitaRepo
} = require('../repositories/receitaRepository');

// Recebe o payload validado, normaliza o nome e envia para inserção SQL
async function createReceitaService(usuarioId, payload) {

    const {
        nome,
        descricao,
        modo_preparo,
        ingredientes
    } = payload;

    const normalizedNome = nome.trim();
    const normalizedDescricao = descricao.trim();
    const normalizedModoPreparo = modo_preparo.trim();

    return createReceitaRepo({
        usuario_id: usuarioId,
        nome: normalizedNome,
        descricao: normalizedDescricao,
        modo_preparo: normalizedModoPreparo,
        ingredientes
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
async function updateReceitaService(receitaId, payload, usuarioId) {
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
        usuarioId
    );
}

async function inserirIngredienteReceitaService(receitaId, payload, usuarioId) {
    const { ingrediente_id, quantidade, unidade_de_medida } = payload;
    return inserirIngredienteReceitaRepo(receitaId, {
        ingrediente_id,
        quantidade,
        unidade_de_medida
    }, usuarioId);
}

async function removerIngredienteReceitaService(receitaId, ingredienteId, usuarioId) {
    return removerIngredienteReceitaRepo(receitaId, ingredienteId, usuarioId);
}

module.exports = {
    removerIngredienteReceitaService,
    inserirIngredienteReceitaService,
    createReceitaService,
    getGastoPorReceitaService,
    getGastoReceitaService,
    updateReceitaService,
};
