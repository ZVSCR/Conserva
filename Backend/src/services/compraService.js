const {
    createCompraRepo
} = require('../repositories/compraRepository')



async function createCompraService(userId, validatedPayload) {

    const {
        data_compra,
        estabelecimento,
        itens
    } = validatedPayload;

    return createCompraRepo({
        usuario_id: userId,
        data_compra,
        estabelecimento,
        itens
    });
}

module.exports = {
    createCompraService
}
