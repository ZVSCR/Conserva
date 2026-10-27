const requireAuth = require('./requireAuth');

module.exports = function ingredienteUser(req, res, next) {
    return requireAuth(req, res, () => {
        if (req.user.id !== 1) {
            return res.status(403).json({ error: 'Apenas o administrador pode alterar ingredientes.' });
        }
        req.ingredienteUsuarioId = req.user.id;
        return next();
    });
};
