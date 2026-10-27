const requireAuth = require('./requireAuth');

module.exports = function receitaUser(req, res, next) {
    return requireAuth(req, res, () => {
        req.receitaUsuarioId = req.user.id;
        next();
    });
};
