// Contrato da validação:
// {
//      isValid: boolean,
//      errors: [{field: string, message: string}]
// }

// Formato de data padrão
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Criação de erros
function createError(field, message) {

    return { field, message };
}

// Valida Strings
function validateString({
    value,
    field,
    required = true,
    maxLength,
    messages
}) {

    if (value === undefined || value === null) {

        // Campo obrigatório -> erro / Campo opcional -> segue
        if (required) {

            return [createError(field, messages.required)];
        }
    }

    if (typeof value !== 'string') {

        // Erro de formato inválido
        return [createError(field, messages.type)];
    }

    const normalizedValue = value.trim();

    if (!normalizedValue) {

        // Valor é "    "
        return [createError(field, messages.blank)];
    }

    if (
        maxLength !== undefined &&
        normalizedValue.length > maxLength
    ) {
        // Ultrapassa limite de caracteres
        return [createError(field, messages.maxLength)];
    }

    return [];
}

function validateDate({
    value,
    field,
    required = true,
    minYear,
    messages
}) {

    if (value === undefined || value === null) {

        // Campo obrigatório -> erro / Campo opcional -> segue
        if (required) {

            return [createError(field, messages.required)];
        }
    }

    if (typeof value !== 'string') {

        // Data não é string -> erro
        return [createError(field, messages.type)];
    }

    if (!DATE_PATTERN.test(value)) {

        // Formato não é YYYY-MM-DD -> erro
        return [createError(field, messages.format)];
    }

    const [year, month, day] = value.split('-').map(Number);

    if (
        minYear !== undefined &&
        year < minYear
    ) {
        // Ano informado está abaixo do mínimo -> erro
        return [createError(field, messages.minYear)];
    }

    const candidate = new Date(Date.UTC(year, month - 1, day));
    const isRealDate =
        candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month &&
        candidate.getUTCDate() === day;

    // Data fornecida não existe -> erro
    return isRealDate ? [] : [createError(field, messages.invalid)];
}

function validateNumber({
    value,
    field,
    required = true,
    messages
}) {
    if (value === undefined || value === null) {

        // Campo obrigatório -> erro / Campo opcional -> segue
        if (required) {

            return [createError(field, messages.required)];
        }
    }

    if (
        typeof value !== 'number' ||
        !Number.isFinite(value)
    ) {
        // Tipo não é number -> erro
        return [createError(field, messages.type)];
    }

    return [];
}

module.exports = {
    validateString,
    validateDate,
    validateNumber
};