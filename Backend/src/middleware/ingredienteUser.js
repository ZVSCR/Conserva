// PATCH/DELETE: ?usuario_id=ID, seguindo o padrão de receitas e compras.
const requireAuth = require('./requireAuth');

module.exports = function ingredienteUser(req, res, next) {
    const value = req.query.usuario_id;
    const usuarioId = typeof value === 'string' && /^[1-9]\d*$/.test(value)
        ? Number(value)
        : null;

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
            error: [{
                field: 'usuario_id',
                message: 'Informe um ID de usuário inteiro e positivo.'
            }]
        });
    }
}

module.exports = function ingredienteUser(req, res, next) {
    return requireAuth(req, res, () => {
        if (req.user.id !== 1) {
            return res.status(403).json({ error: 'Apenas o administrador pode alterar ingredientes.' });
        }
        req.ingredienteUsuarioId = req.user.id;
        next();
    });
};