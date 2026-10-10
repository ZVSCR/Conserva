const {
    createCompraRepo,
    adicionaItensACompraRepo
} = require('../repositories/compraRepository');
const { normalizarItens } = require('./granularidadeService');

async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(itens);
    let itensTotalValueInCents = 0;

    itensNormalizados.forEach((item) => {
        const valorInCents = Math.round(100 * item.valor_unitario);
        itensTotalValueInCents += item.quantidade * valorInCents;
    });

    const itensTotalValueRounded = Math.round(itensTotalValueInCents);
    const itensTotalValueReal = itensTotalValueRounded / 100;

    return createCompraRepo({
        usuario_id: userId,
        data_compra,
        estabelecimento,
        valor_total: itensTotalValueReal,
        itens: itensNormalizados
    });
}

async function adicionaItensACompraService(userId, compraId, validatedPayload) {

    const {
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(itens);
    let newItensValueInCents = 0;

    itensNormalizados.forEach((item) => {
        const valorInCents = Math.round(100 * item.valor_unitario);
        newItensValueInCents += item.quantidade * valorInCents;
    });

    const itensTotalValueRounded = Math.round(newItensValueInCents);
    const itensTotalValueReal = (itensTotalValueRounded / 100).toFixed(2);

    return adicionaItensACompraRepo({
        usuario_id: userId,
        compra_id: compraId,
        valor_itens_novos: itensTotalValueReal,
        itens: itensNormalizados
    });

}

module.exports = {
    createCompraService,
    adicionaItensACompraService
}
