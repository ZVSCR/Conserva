// Importa validação de strings
const { validateString } = require('./generalValidator');

function validateUsername(username) {

    // Username é obrigatório, não nulo, e com limite de 50 caracteres
    const errors = validateString({
        value: username,
        field: 'username',
        maxLength: 50,
        messages: {
            required: 'Username é obrigatório.',
            type: 'Username possui formato inválido.',
            blank: 'Username não pode conter apenas espaços.',
            maxLength: 'Username deve possuir no máximo 50 caracteres.'
        }
    });

    if (errors.length === 0 && username.includes('@')) {
        errors.push({ field: 'username', message: 'Nome de usuário não pode conter @. Utilize seu email no campo de email.' });
    }

    return errors;
}

function validateEmail(email) {

    // Email é obrigatório, não nulo, e com limite de 100 caracteres
    const errors = validateString({
        value: email,
        field: 'email',
        maxLength: 100,
        messages: {
            required: 'Email é obrigatório.',
            type: 'Email possui formato inválido.',
            blank: 'Email não pode conter apenas espaços.',
            maxLength: 'Email deve possuir no máximo 100 caracteres.'
        }
    });

    if (errors.length === 0 && !/^[^\s@]+@[^\s@]+$/.test(email.trim())) {
        errors.push({ field: 'email', message: 'Informe um email válido, como nome@exemplo.com.' });
    }

    return errors;
}

function validateTipo(tipo) {

    // Tipo é obrigatório, não nulo, e com limite de 11 caracteres
    const errors = validateString({
        value: tipo,
        field: 'tipo',
        maxLength: 11,
        messages: {
            required: 'Tipo é obrigatório.',
            type: 'Tipo possui formato inválido.',
            blank: 'Tipo não pode conter apenas espaços.',
            maxLength: 'Tipo deve possuir no máximo 11 caracteres.'
        }
    });

    if (errors.length === 0 && !['domestico', 'comercial'].includes(tipo.trim().toLowerCase())) {
        errors.push({ field: 'tipo', message: 'Tipo de conta deve ser domestico ou comercial.' });
    }

    return errors;
}

function validatePassword(password) {

    // Password é obrigatório e não nulo
    return validateString({
        value: password,
        field: 'password',
        messages: {
            required: 'Password é obrigatório.',
            type: 'Password possui formato inválido.',
            blank: 'Password não pode conter apenas espaços.'
        }
    });
}

function validateIdentifier(identifier) {

    // Identificador é obrigatório, não nulo, e com limite de 100 caracteres
    return validateString({
        value: identifier,
        field: 'identifier',
        maxLength: 100,
        messages: {
            required: 'Identificador é obrigatório.',
            type: 'Identificador possui formato inválido.',
            blank: 'Identificador não pode conter apenas espaços.',
            maxLength: 'Identificador deve possuir no máximo 100 caracteres.'
        }
    });
}

function validateRegister(user) {

    const errors = [];

    // Verifica integridade de req.body
    if (
        user === undefined ||
        user === null ||
        Array.isArray(user) ||
        typeof user !== 'object'
    ) {
        errors.push({
            field: 'req',
            message: 'A requisição enviada não é um objeto válido.'
        });

        return {
            isValid: false,
            errors
        };
    }

    const {
        username,
        email,
        password,
        tipo
    } = user;

    // Valida cada campo de req.body
    errors.push(...validateUsername(username));
    errors.push(...validateEmail(email));
    errors.push(...validatePassword(password));
    errors.push(...validateTipo(tipo));

    return {
        isValid: errors.length === 0,
        errors
    };
}

function validateLogin(user) {

    const errors = [];

    // Verifica integridade de req.body
    if (
        user === undefined ||
        user === null ||
        Array.isArray(user) ||
        typeof user !== 'object'
    ) {
        errors.push({
            field: 'req',
            message: 'A requisição enviada não é um objeto válido.'
        });

        return {
            isValid: false,
            errors
        };
    }

    const {
        identifier,
        password
    } = user;

    // Valida cada campo de req.body
    errors.push(...validateIdentifier(identifier));
    errors.push(...validatePassword(password));

    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateRegister,
    validateLogin,
    validateUsername,
    validateEmail,
    validateTipo
};
