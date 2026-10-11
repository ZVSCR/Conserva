const {
    createCompraRepo,
    adicionaItensACompraRepo
} = require('../repositories/compraRepository');
const { normalizarItens, tipoMedida } = require('./granularidadeService');
const { calcularValorUnitario } = require('./precoService');

function converterPrecos(itens) {
    return itens.map((item) => {
        const embalagens = tipoMedida(item) === 'variavel'
            ? (item.numero_embalagens ?? 1)
            : 1;

        return {
            ...item,
            valor_unitario: calcularValorUnitario(item.valor_unitario, item.quantidade * embalagens)
        };
    });
}

function somarTotal(itensNormalizados) {
    const centavos = itensNormalizados.reduce(
        (soma, item) => soma + Math.round(item.valor_unitario * 100) * item.quantidade,
        0
    );
    return Math.round(centavos) / 100;
}

async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(converterPrecos(itens));

    return createCompraRepo({
        usuario_id: userId,
        data_compra,
        estabelecimento,
        valor_total: somarTotal(itensNormalizados),
        itens: itensNormalizados
    });
}

async function adicionaItensACompraService(userId, compraId, validatedPayload) {

    const {
        itens
    } = validatedPayload;

    const itensNormalizados = normalizarItens(converterPrecos(itens));

    return adicionaItensACompraRepo({
        usuario_id: userId,
        compra_id: compraId,
        valor_itens_novos: somarTotal(itensNormalizados).toFixed(2),
        itens: itensNormalizados
    });

}

module.exports = {
    createCompraService,
    adicionaItensACompraService
}
