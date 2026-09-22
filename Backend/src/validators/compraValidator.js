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

    const errors = [];

    // Estabelecimento existe?
    if (estabelecimento === undefined || estabelecimento === null) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento é obrigatório.'
        });

        return errors;
    }

    // Estabelecimento é string?
    if (typeof estabelecimento !== 'string') {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento possui formato inválid./'
        });

        return errors;
    }

    const normalizedEstabelecimento = estabelecimento.trim();

    // Estabelecimento é "    "?
    if (!normalizedEstabelecimento) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento não pode conter apenas espaços.'
        });

        return errors;
    }

    // Estabelecimento ultrapassa limite de caracteres?
    if (normalizedEstabelecimento.length > 50) {
        errors.push({
            field: 'estabelecimento',
            message: 'Estabelecimento deve possuir no máximo 50 caracteres.'
        });

        return errors;
    }

    return errors;
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

        return {
            isValid: false,
            errors
        };
    }

    const {
        data_compra,
        estabelecimento,
        itens
    } = payload;

    errors.push(...validateEstabelecimento(estabelecimento));

    itens.forEach((item, index) => {
        // TODO: validação de itens
    });

    return {
        isValid: errors.length == 0,
        errors
    };
}

module.exports = {
    validateCreateCompraPayload
};