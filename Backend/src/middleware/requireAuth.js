const { findUserDataById } = require('../repositories/userRepository');
const { clearSessionCookie } = require('../config/session');

module.exports = async function requireAuth(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (!Number.isSafeInteger(req.session?.userId) || req.session.userId <= 0) {
        return res.status(401).json({ error: 'Faça login para continuar.' });
    }

    try {
        const user = await findUserDataById(req.session.userId);
        if (!user) {
            await new Promise((resolve, reject) => req.session.destroy((error) => error ? reject(error) : resolve()));
            clearSessionCookie(res);
            return res.status(401).json({ error: 'A sessão não corresponde a um usuário existente.' });
        }

        req.user = user;
        return next();
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        return res.status(503).json({ error: 'Não foi possível verificar a sessão.' });
    }
};
