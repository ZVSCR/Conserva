// Importa validação de campos
const {
    validateString
} = require('./generalValidator');

function validateReceitaPayload(payload) {

    // TODO: validar string de nome
    // TODO: validar texto descrição
    // TODO: validar texto de modo de preparo

    // Nome é obrigatório, não nulo e limite de 100 caracteres
    // Descrição é obrigatório e não nulo
    // Modo de preparo é obrigatório e não nulo
}

module.exports = {
    validateReceitaPayload
};