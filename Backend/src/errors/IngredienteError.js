class IngredienteError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = 'IngredienteError';
        this.statusCode = statusCode;
    }
}

module.exports = { IngredienteError };
