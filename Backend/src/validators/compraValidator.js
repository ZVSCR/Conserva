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

    // Valida nome de itens
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

    // 2. QUANTIDADE
    // 2.1 existe?
    if (number === undefined || number === null) {
        errors.push({
            field: `${fieldPrefix}.quantidade`,
            message: `Quantidade do item ${index + 1} é obrigatória.`
        });
    } else if (

        // 2.2 é Number?
        typeof quantidade !== 'number' ||
        !Number.isFinite(quantidade)
    ) {
        errors.push({
            field: `${fieldPrefix}.quantidade`,
            message: `Quantidade do item ${index + 1} precisa ser um número.`
        });
    } else if (quantidade <= 0) {

        // TODO: 2.3 é > 0?
        errors.push({
            field: `${fieldPrefix}`,
            message: `Quantidade do item ${index + 1} deve ser maior que zero.`
        });
    }

    // 3. UNIDADE DE MEDIDA
    // 3.1 existe?
    if (
        unidade_de_medida === undefined ||
        unidade_de_medida === null
    ) {
        errors.push({
            field: `${fieldPrefix}.unidade_de_medida`,
            message: `A unidade de medida ${index + 1} é obrigatória.`
        });
    } else {

        // 3.2 é string?
        if (typeof unidade_de_medida !== 'string') {
            errors.push({
                field: `${fieldPrefix}.unidade_de_medida`,
                message: `Formato da unidade de medida do item ${index + 1} inválida.`
            });
        } else {

            // 3.3 é "    "?
            const normalizedUnidadeDeMedida = unidade_de_medida.trim();
            if (!normalizedUnidadeDeMedida) {
                errors.push({
                    field: `${fieldPrefix}.unidade_de_medida`,
                    message: `Unidade de medida do item ${index + 1} não pode conter apenas espaços.`
                });
            }

            // 3.4 tem até 20 caracteres?
            if (normalizedUnidadeDeMedida.length > 20) {
                errors.push({
                    field: `${fieldPrefix}.unidade_de_medida`,
                    message: `Unidade de medida do item ${index + 1} deve possuir no máximo 20 caracteres.`
                });
            }
        }
    }

    // TODO: 4. VALOR UNITÁRIO
    // TODO: 4.1 é Number?
    if () {

    } else {
        // TODO: 4.2 é >= 0?
    }

    // TODO: 5. DATA DE VALIDADE ESTIMADA
    // TODO: 5.1 foi fornecida?
    if () {

    } else {
        // TODO: 5.2 é string?
        // TODO: 5.3 formato é YYYY-MM-DD?
        // TODO: 5.4 data existe?
    }

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