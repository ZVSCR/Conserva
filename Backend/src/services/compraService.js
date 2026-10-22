const {
    createCompraRepo,
    adicionaItensACompraRepo
} = require('../repositories/compraRepository');
const { normalizarItens } = require('./granularidadeService');
const { somarTotalItens } = require('./precoService');

async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(itens);

    return createCompraRepo({
        usuario_id: userId,
        data_compra,
        estabelecimento,
        valor_total: somarTotalItens(itensNormalizados),
        itens: itensNormalizados
    });
}

async function adicionaItensACompraService(userId, compraId, validatedPayload) {

    const {
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(itens);

    return adicionaItensACompraRepo({
        usuario_id: userId,
        compra_id: compraId,
        valor_itens_novos: somarTotalItens(itensNormalizados).toFixed(2),
        itens: itensNormalizados
    });

}

module.exports = {
    createCompraService,
    adicionaItensACompraService
}
