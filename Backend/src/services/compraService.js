const {
    createCompraRepo
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

module.exports = {
    createCompraService
}
