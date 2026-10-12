// Autenticação provisória: finge que o usuário 1 está logado.
// Trocar por requireAuth quando a autenticação real for ligada.
module.exports = function mockAuth(req, res, next) {
    req.user = { id: 1 };
    next();
};