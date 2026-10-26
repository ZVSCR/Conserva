const jwt = require('jsonwebtoken');
const {
    getSessionSecret,
    readSessionToken,
    clearSessionCookie
} = require('../config/session');

function requireAuth(req, res, next) {
    const token = readSessionToken(req);

    if (!token) {
        return res.status(401).json({ error: 'É necessário entrar na sua conta.' });
    }

    let secret;
    try {
        secret = getSessionSecret();
    } catch (error) {
        console.error('Configuração da sessão inválida:', error);
        return res.status(500).json({ error: 'A autenticação não está configurada corretamente.' });
    }

    try {
        const payload = jwt.verify(token, secret);

        if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
            clearSessionCookie(res);
            return res.status(401).json({ error: 'Sessão inválida. Entre novamente.' });
        }

        req.user = { id: payload.sub };
        return next();
    } catch (error) {
        clearSessionCookie(res);
        return res.status(401).json({ error: 'Sessão expirada ou inválida. Entre novamente.' });
    }
}

module.exports = requireAuth;
