const session = require('express-session');
const createSessionStore = require('./sessionStore');
require('dotenv').config();

const SESSION_COOKIE_NAME = 'conservia.sid';

function getSessionConfig(env = process.env) {
    if (!env.SESSION_SECRET || Buffer.byteLength(env.SESSION_SECRET) < 32) {
        throw new Error('Configure SESSION_SECRET com uma chave aleatória de pelo menos 32 bytes.');
    }

    const maxAge = Number(env.SESSION_MAX_AGE_MS || 86400000);
    if (!Number.isSafeInteger(maxAge) || maxAge <= 0) {
        throw new Error('SESSION_MAX_AGE_MS deve ser um inteiro positivo.');
    }

    const frontendOrigin = env.FRONTEND_ORIGIN || 'http://localhost:5173';
    const originUrl = new URL(frontendOrigin);
    if (!['http:', 'https:'].includes(originUrl.protocol) || originUrl.origin !== frontendOrigin) {
        throw new Error('FRONTEND_ORIGIN deve conter apenas a origem do frontend, sem caminho ou barra final.');
    }

    return {
        secret: env.SESSION_SECRET,
        frontendOrigin,
        cookie: { httpOnly: true, sameSite: 'lax', secure: env.NODE_ENV === 'production', path: '/', maxAge }
    };
}

function createSessionMiddleware({ store, env } = {}) {
    const config = getSessionConfig(env);
    return session({
        name: SESSION_COOKIE_NAME,
        secret: config.secret,
        store: store ?? createSessionStore(),
        resave: false,
        saveUninitialized: false,
        rolling: false,
        cookie: config.cookie
    });
}

function clearSessionCookie(res) {
    const { maxAge, ...cookie } = getSessionConfig().cookie;
    res.clearCookie(SESSION_COOKIE_NAME, cookie);
}

module.exports = { createSessionMiddleware, getSessionConfig, clearSessionCookie, SESSION_COOKIE_NAME };
