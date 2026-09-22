// Validação de campos
const {
    validateString,
    validateDate,
    validateNumber
} = require('./generalValidator');

// Valida integridade da entrada de estabelecimento
function validateEstabelecimento(estabelecimento) {

    return validateString({
        value: estabelecimento,
        field: 'estabelecimento',
        maxLength: 50,
        messages: {
            required: 'Estabelecimento é obrigatório.',
            type: 'Estabelecimento possui formato inválido.',
            blank: 'Estabelecimento não pode conter apenas espaços.',
            maxLength: 'Estabelecimento deve possuir no máximo 50 caracteres.'
        }
    });
}

// Valida integridade da entrada de data de compra, se existe
function validateDataCompra(dataCompra) {

    return validateDate({
        value: dataCompra,
        field: 'data_compra',
        required: false,
        minYear: 1926,
        messages: {
            type: 'Formato de data inválido. Data deve ser string.',
            format: 'Formato de data inválido. O formato correto é YYYY-MM-DD',
            minYear: 'Forneça um ano igual ou posterior a 1926.',
            invalid: 'Data não existe. Forneça uma data existente'
        }
    });
    // NOTE: datas futuras devem ser aceitas?
}

function validateItem(item, index) {
    // TODO: validar um item e identificar sua posição

    const errors = [];
    const fieldPrefix = `itens[${index}]`; // Nomenclatura do item

    // Item existe?
    if (
        item === undefined ||       // Item não definido?
        item === null ||            // Item nulo?
        Array.isArray(item) ||      // Item é array? (deve ser objeto)
        typeof item !== 'object'    // Item não é objeto?
    ) {
        errors.push({
            field: fieldPrefix,
            message: `Item ${index + 1} não é um objeto válido.`
        });

        return errors;
    }

    // Agora, campos estão seguros para acesso
    const {
        nome_item,
        quantidade,
        unidade_de_medida,
        valor_unitario,
        validade_estimada
    } = item;

    // Deste modo, cada erro pode explicitar campo
    // ${fieldPrefix}.nome_campo

    // Nome de itens
    errors.push(...validateString({
        value: nome_item,
        field: `${fieldPrefix}.nome_item`,
        maxLength: 100,
        messages: {
            required: `O nome do item ${index + 1} é obrigatório.`,
            type: `Formato do nome do item ${index + 1} é inválido.`,
            blank: `Nome do item ${index + 1} não pode conter apenas espaços.`,
            maxLength: `Nome do item ${index + 1} deve possuir no máximo 100 caracteres.`
        }
    }));

    // Quantidade
    errors.push(...validateNumber({
        value: quantidade,
        field: `${fieldPrefix}.quantidade`,
        messages: {
            required: `Quantidade do item ${index + 1} é obrigatória.`,
            type: `Formato da quantidade do item ${index + 1} não é válido.`,
            positive: `Quantidade do item ${index + 1} deve ser maior que zero.`
        }
    }));

    // Unidade de Medida
    errors.push(...validateString({
        value: unidade_de_medida,
        field: `${fieldPrefix}.unidade_de_medida`,
        maxLength: 20,
        messages: {
            required: `Unidade de medida do item ${index + 1} é obrigatória.`,
            type: `Formato de unidade de medida do item ${index + 1} é inválido.`,
            blank: `Unidade de medida do item ${index + 1} não pode conter apenas espaços`,
            maxLength: `Unidade de medida do item ${index + 1} deve possuir no máximo 20 caracteres.`
        }
    }));

    // Valor unitário
    errors.push(...validateNumber({
        value: valor_unitario,
        field: `${fieldPrefix}.valor_unitario`,
        positive: false,
        messages: {
            required: `Valor unitário do item ${index + 1} é obrigatório.`,
            type: `Formato de valor unitário do item ${index + 1} é inválido.`,
            nonNegative: `Valor unitário do item ${index + 1} deve ser maior ou igual a zero.`
        }
    }));

    errors.push(...validateDate({
        value: validade_estimada,
        field: `${fieldPrefix}.validade_estimada`,
        required: false,
        minYear: 1926,
        messages: {
            type: `Formato da data de validade do item ${index + 1} é inválido. O formato correto é string.`,
            format: `Formato da data de validade do item ${index + 1} é inválido. Escreva no formato YYYY-MM-DD.`,
            minYear: `Forneça um ano igual ou posterior a 1926 para a data de validade do item ${index + 1}.`,
            invalid: `Data de validade do item ${index + 1} não existe. Forneça uma data existente.`
        }
    }));

    return errors;
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