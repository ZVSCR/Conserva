// Importa validação de campos
const {
    validateString,
    validateNumber
} = require('./generalValidator');

const {
    quantidadeRepresentavel
} = require('../services/granularidadeService');

const UNIDADES_DE_MEDIDA = new Set(['un', 'kg', 'g', 'L', 'mL']);

function validateNome(nome) {

    // Nome é obrigatório, não nulo e com limite de 100 caracteres.
    return validateString({
        value: nome,
        field: 'nome',
        maxLength: 100,
        messages: {
            required: 'Nome é obrigatório.',
            type: 'Nome possui formato inválido.',
            blank: 'Nome não pode conter apenas espaços.',
            maxLength: 'Nome deve possuir no máximo 100 caracteres.'
        }
    });
}

function validateDescricao(descricao) {

    // Descrição é obrigatória, não nula e com limite de até 1.000 caracteres
    return validateString({
        value: descricao,
        field: 'descricao',
        maxLength: 1000,
        messages: {
            required: 'Descrição é obrigatória.',
            type: 'Descrição possui formato inválido.',
            blank: 'Descrição não pode conter apenas espaços.',
            maxLength: 'Descrição deve possuir no máximo 1.000 caracteres.'
        }
    });
}

function validateModoPreparo(modoPreparo) {

    // Modo de preparo é obrigatório, não nulo e com limite de 10.000 caracteres
    return validateString({
        value: modoPreparo,
        field: 'modo_preparo',
        maxLength: 10000,
        messages: {
            required: 'Modo de preparo é obrigatório.',
            type: 'Modo de preparo possui formato inválido.',
            blank: 'Modo de preparo não pode conter apenas espaços.',
            maxLength: 'Modo de preparo deve possuir no máximo 10.000 caracteres.'
        }
    });
}

function validateIngrediente(ingrediente, index) {

    const errors = [];
    const fieldPrefix = `ingredientes[${index}]`;

    if (
        ingrediente === undefined ||
        ingrediente === null ||
        Array.isArray(ingrediente) ||
        typeof ingrediente !== 'object'
    ) {
        return [{
            field: fieldPrefix,
            message: `Ingrediente ${index + 1} não é um objeto válido.`
        }];
    }

    const {
        nome,
        quantidade,
        unidade_de_medida
    } = ingrediente;

    errors.push(...validateString({
        value: nome,
        field: `${fieldPrefix}.nome`,
        maxLength: 100,
        messages: {
            required: `Nome do ingrediente ${index + 1} é obrigatório.`,
            type: `Formato do nome do ingrediente ${index + 1} é inválido.`,
            blank: `Nome do ingrediente ${index + 1} não pode conter apenas espaços.`,
            maxLength: `Nome do ingrediente ${index + 1} deve possuir no máximo 100 caracteres.`
        }
    }));

    errors.push(...validateNumber({
        value: quantidade,
        field: `${fieldPrefix}.quantidade`,
        messages: {
            required: `Quantidade do ingrediente ${index + 1} é obrigatória.`,
            type: `Formato da quantidade do ingrediente ${index + 1} é inválido.`,
            positive: `Quantidade do ingrediente ${index + 1} deve ser maior que zero.`
        }
    }));

    if (typeof quantidade === 'number' && Number.isFinite(quantidade) &&
        quantidade > 0 && !quantidadeRepresentavel(quantidade)) {

        errors.push({
            field: `${fieldPrefix}.quantidade`,
            message: 'Quantidade deve ter até duas casas decimais e ser no máximo 9.999.999,99.'
        });
    }

    errors.push(...validateString({
        value: unidade_de_medida,
        field: `${fieldPrefix}.unidade_de_medida`,
        maxLength: 20,
        messages: {
            required: `Unidade de medida do ingrediente ${index + 1} é obrigatória.`,
            type: `Formato da unidade de medida do ingrediente ${index + 1} é inválido.`,
            blank: `Unidade de medida do ingrediente ${index + 1} não pode conter apenas espaços.`,
            maxLength: `Unidade de medida do ingrediente ${index + 1} deve possuir no máximo 20 caracteres.`
        }
    }));

    if (typeof unidade_de_medida === 'string' && unidade_de_medida.trim() &&
        !UNIDADES_DE_MEDIDA.has(unidade_de_medida)) {

        errors.push({
            field: `${fieldPrefix}.unidade_de_medida`,
            message: 'Unidade de medida deve ser un, kg, g, L ou mL.'
        });
    }

    return errors;
}

function validateIngredientes(ingredientes) {

    if (ingredientes === undefined || ingredientes === null) {
        return [{
            field: 'ingredientes',
            message: 'A receita deve conter ao menos um ingrediente.'
        }];
    }

    if (!Array.isArray(ingredientes)) {
        return [{
            field: 'ingredientes',
            message: 'Formato de ingredientes inválido. Deve ser um array.'
        }];
    }

    const errors = [];

    if (ingredientes.length === 0) {
        errors.push({
            field: 'ingredientes',
            message: 'A receita deve conter ao menos um ingrediente.'
        });
    }

    ingredientes.forEach((ingrediente, index) => {
        errors.push(...validateIngrediente(ingrediente, index));
    });

    return errors;
}

function validateReceitaPayload(payload, validateIngredients = false) {

    const errors = [];

    // Verifica payload
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
        nome,
        descricao,
        modo_preparo
    } = payload;

    // Valida cada campo do payload
    errors.push(...validateNome(nome));
    errors.push(...validateDescricao(descricao));
    errors.push(...validateModoPreparo(modo_preparo));

    if (validateIngredients) {
        errors.push(...validateIngredientes(payload.ingredientes));
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateReceitaPayload
};
