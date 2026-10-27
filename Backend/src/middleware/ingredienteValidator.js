function validateIngredientePayload(body) {
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
        return {
            isValid: false,
            errors: [{ field: 'body', message: 'O corpo da requisição deve ser um objeto JSON.' }]
        };
    }

    const errors = [];
    const { nome } = body;

    if (typeof nome !== 'string' || nome.trim().length === 0) {
        errors.push({ field: 'nome', message: 'nome deve ser um texto não vazio.' });
    } else if (nome.trim().length > 100) {
        errors.push({ field: 'nome', message: 'nome deve ter no máximo 100 caracteres.' });
    } else if (!/[\p{L}\p{N}]/u.test(nome)) {
        errors.push({ field: 'nome', message: 'nome deve conter letras ou números.' });
    }

    return { isValid: errors.length === 0, errors };
}

function validateIngredienteId(value) {
    const id = typeof value === 'string' && /^[1-9]\d*$/.test(value)
        ? Number(value)
        : null;
    const isValid = Number.isSafeInteger(id) && id > 0;

    return {
        isValid,
        errors: isValid ? [] : [{
            field: 'ingrediente_id',
            message: 'Informe um ID de ingrediente inteiro e positivo.'
        }]
    };
}

module.exports = { validateIngredientePayload, validateIngredienteId };
