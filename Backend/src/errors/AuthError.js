class AuthError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.name = "AuthError";
        this.statusCode = statusCode;
    }
}

module.exports = {
    AuthError
};