// Identificação temporária fornecida pelo cliente; não substitui autenticação.
// DELETE: ?usuario_id=ID, seguindo o padrão de receitas e compras.
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

    req.ingredienteUsuarioId = usuarioId;
    next();
};
