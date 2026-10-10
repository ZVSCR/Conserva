// Validação de campos
const {
    validateString,
    validateDate,
    validateNumber
} = require('./generalValidator');
const {
    UNIDADES_VARIAVEIS,
    MAX_EMBALAGENS,
    MAX_ITENS_EXPANDIDOS,
    quantidadeRepresentavel,
    tipoMedida
} = require('../services/granularidadeService');

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

// Valida cada campo do registro de um item
function validateItem(item, index) {

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
        tipo_medida,
        numero_embalagens,
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

    const tipo = tipoMedida(item);
    if (tipo_medida !== undefined && !['unitaria', 'variavel'].includes(tipo_medida)) {
        errors.push({ field: `${fieldPrefix}.tipo_medida`, message: 'tipo_medida deve ser unitaria ou variavel.' });
    } else if (typeof unidade_de_medida === 'string' && unidade_de_medida.trim() && unidade_de_medida.length <= 20) {
        if (tipo === 'unitaria' && unidade_de_medida !== 'un') {
            errors.push({ field: `${fieldPrefix}.unidade_de_medida`, message: 'Item unitário deve usar un.' });
        }
        if (tipo === 'variavel' && !UNIDADES_VARIAVEIS.has(unidade_de_medida)) {
            errors.push({ field: `${fieldPrefix}.unidade_de_medida`, message: 'Item variável deve usar kg, g, L ou mL.' });
        }
    }

    if (typeof quantidade === 'number' && Number.isFinite(quantidade) && quantidade > 0 &&
        tipo === 'unitaria' && !Number.isSafeInteger(quantidade)) {
        errors.push({ field: `${fieldPrefix}.quantidade`, message: 'Quantidade unitária deve ser um inteiro positivo.' });
    }

    if (numero_embalagens !== undefined) {
        if (tipo !== 'variavel' || !Number.isSafeInteger(numero_embalagens) ||
            numero_embalagens < 1 || numero_embalagens > MAX_EMBALAGENS) {
            errors.push({
                field: `${fieldPrefix}.numero_embalagens`,
                message: `numero_embalagens deve ser um inteiro de 1 a ${MAX_EMBALAGENS} para item variável.`
            });
        }
    }

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
    if (typeof quantidade === 'number' && Number.isFinite(quantidade) && quantidade > 0 &&
        !quantidadeRepresentavel(quantidade)) {
        errors.push({
            field: `${fieldPrefix}.quantidade`,
            message: 'Quantidade deve ter até duas casas decimais e caber no campo do banco.'
        });
    }

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

    // Data de validade estimada
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

    const errors = [];

    // Lista de itens existe?
    if (itens === undefined || itens === null) {

        errors.push({
            field: 'itens',
            message: 'O registro de itens é obrigatório.'
        });

        return errors;
    }

    // Lista de itens é array?
    if (!Array.isArray(itens)) {

        errors.push({
            field: 'itens',
            message: 'Formato do registro de itens inválido. Deve ser um array.'
        });

        return errors;
    }

    // Array de itens possui ao menos um item?
    if (itens.length === 0) {

        errors.push({
            field: 'itens',
            message: 'Compra deve ter ao menos um item registrado.'
        });
    }

    // Validação de cada item da lista
    itens.forEach((item, index) => {

        errors.push(...validateItem(item, index));
    });

    const totalExpandido = itens.reduce((total, item) => {
        if (!item || typeof item !== 'object' || Array.isArray(item)) return total;
        const numero = tipoMedida(item) === 'variavel' ? (item.numero_embalagens ?? 1) : 1;
        return total + (Number.isSafeInteger(numero) && numero > 0 ? numero : 0);
    }, 0);
    if (totalExpandido > MAX_ITENS_EXPANDIDOS) {
        errors.push({ field: 'itens', message: `A compra pode conter até ${MAX_ITENS_EXPANDIDOS} registros de item.` });
    }

    return errors;
}

function validateCreateCompraPayload(payload) {

    const errors = [];

    // Payload é objeto?
    if (
        payload === undefined ||
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

    // Valida estabelecimento, data de compra e itens
    errors.push(...validateEstabelecimento(estabelecimento));
    errors.push(...validateDataCompra(data_compra));
    errors.push(...validateItens(itens));

    return {
        isValid: errors.length == 0,
        errors
    };
}

function validateItensPayload(payload) {

    const errors = [];

    // Payload é objeto?
    if (
        payload === undefined ||
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
        itens
    } = payload;

    // Valida itens
    errors.push(...validateItens(itens));

    return {
        isValid: errors.length == 0,
        errors
    };

}

module.exports = {
    validateCreateCompraPayload,
    validateItensPayload,
    validateItem
};
