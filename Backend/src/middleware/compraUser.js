// Identificação fornecida pelo cliente; ainda não substitui autenticação.
// POST: usuario_id no corpo. GET/PATCH/DELETE: ?usuario_id=ID.
module.exports = function compraUser(req, res, next) {
    const value = req.method === 'POST' ? req.body?.usuario_id : req.query.usuario_id;
    const usuarioId = req.method === 'POST'
        ? value
        : (typeof value === 'string' && /^[1-9]\d*$/.test(value) ? Number(value) : null);

    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
        return res.status(400).json({
            error: [{ field: 'usuario_id', message: 'Informe um ID de usuário inteiro e positivo.' }]
        });
    }

    req.compraUsuarioId = usuarioId;
    next();
};
