const {
    getValorTotalCompra,
    createCompraRepo,
    updateCompraAddItensRepo
} = require('../repositories/compraRepository')



async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    let itensTotalValueInCents = 0;

    itens.forEach((item) => {
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
        itens
    });
}

async function updateCompraAddItensService(userId, compraId, validatedPayload) {

    const {
        itens
    } = validatedPayload;

    const compraTotalValue = getValorTotalCompra(compraId);
    let newItensValueInCents = 0.

    itens.forEach((item) => {
        const valorInCents = Math.round(100 * item.valor_unitario);
        newItensValueInCents += item.quantidade * valorInCents;
    });

    const itensTotalValueRounded = Math.round(newItensValueInCents);
    const itensTotalValueReal = itensTotalValueRounded / 100;

    const compraTotalValueReal = compraTotalValue + itensTotalValueReal;

    return updateCompraAddItensRepo({
        usuario_id: userId,
        compra_id: compraId,
        valor_total: compraTotalValueReal,
        itens
    });

}

module.exports = {
    createCompraService,
    updateCompraAddItensService
}
