// Contrato de retorno de validação quando há erro (exemplo):
// {
//     isValid: false,
//     errors: [
//         {
//             field: 'itens[1].quantidade',
//             message: 'Quantidade deve ser maior que zero.'
//         }
//     ]
// }
// A função principal deve acumular erros
// Cada função então deve retornar um array de erros

// Contrato de retorno de validação quando está tudo certo (exemplo):
// {
//     isValid: true,
//     errors: []
// }

function validateEstabelecimento(estabelecimento) {
    // TODO: validar tipo, trim e tamanho
}

function validateDataCompra(dataCompra) {
    // TODO: se existe, validar formato da data
}

function validateItem(item, index) {
    // TODO: validar um item e identificar sua posição
}

function validateItens(itens) {
    // TODO: validar se array não é vazio
    // TODO: chamar validateItem par cada item
}

function validateCreateCompraPayload(payload) {
    // TODO: executar validações modulares
    // TODO: reunir erros
    // TODO: devolver resultado

    const errors = [];

    // Payload é objeto?
    if (
        payload === null ||
        Array.isArray(payload) ||
        typeof payload !== 'object'
    ) {
        errors.push({
            field: 'payload',
            message: 'A requisição enviada não é um objeto válido.'
        });
    }

    return {
        isValid: errors.length == 0,
        errors
    };
}

module.exports = {
    validateCreateCompraPayload
};