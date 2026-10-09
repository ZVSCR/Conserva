// Importa validação de campos
const {
    validateString
} = require('./generalValidator');

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

function validateReceitaPayload(payload) {

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

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateReceitaPayload
};