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

// Valida integridade da entrada de estabelecimento
function validateEstabelecimento(estabelecimento) {

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

// Valida integridade da entrada de data de compra, se existe
function validateDataCompra(dataCompra) {

    const errors = [];

    // Se data não foi fornecida, encerra execução
    if (dataCompra === undefined || dataCompra === null) {
        return errors;
    }

    // Data é string?
    if (typeof dataCompra !== 'string') {
        errors.push({
            field: 'data_compra',
            message: 'Formato de data inválido. Data deve ser string.'
        });

        return errors;
    }

    // TODO: validar se formato é YYYY-MM-DD
    // TODO: verificar se data realmente existe

    return errors;
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

    // Valida estabelecimento e data de compra
    errors.push(...validateEstabelecimento(estabelecimento));
    errors.push(...validateDataCompra(data_compra));

    // Valida itens
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