const requireAuth = require('./requireAuth');

module.exports = function compraUser(req, res, next) {
    return requireAuth(req, res, () => {
        req.compraUsuarioId = req.user.id;
        next();
    });
};
