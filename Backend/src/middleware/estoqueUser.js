// Identificação temporária fornecida pelo cliente; não substitui autenticação.
// GET/PATCH: ?usuario_id=ID. Preenche req.user para os controllers de estoque.
module.exports = function estoqueUser(req, res, next) {
    const value = req.query.usuario_id;
    const usuarioId = typeof value === 'string' && /^[1-9]\d*$/.test(value)
        ? Number(value)
        : null;

    if (!Number.isSafeInteger(usuarioId)) {
        return res.status(400).json({
            error: [{
                field: 'usuario_id',
                message: 'Informe um ID de usuário inteiro e positivo.'
            }]
        });
    }

    req.user = { id: usuarioId };
    next();
};