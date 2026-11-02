const {
    createCompraRepo,
    adicionaItensACompraRepo
} = require('../repositories/compraRepository');
const { normalizarItens, tipoMedida } = require('./granularidadeService');
const { somarTotalItens, inferirValorUnitario, PrecoInvalidoError } = require('./precoService');

function prepararItens(itens) {
    return normalizarItens(itens.map(({ preco_total_item, ...item }) => {
        if (Object.prototype.hasOwnProperty.call(item, 'valor_unitario')) {
            throw new PrecoInvalidoError('Informe preco_total_item; valor_unitario é calculado pelo servidor.');
        }
        const embalagens = tipoMedida(item) === 'variavel' ? (item.numero_embalagens ?? 1) : 1;
        return {
            ...item,
            valor_unitario: inferirValorUnitario(preco_total_item, item.quantidade, embalagens)
        };
    }));
}

async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    const itensNormalizados = prepararItens(itens);

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

    const itensNormalizados = prepararItens(itens);

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
