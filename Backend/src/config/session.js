const jwt = require('jsonwebtoken');

const SESSION_COOKIE_NAME = 'conservia_session';
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function getSessionSecret() {
    const secret = process.env.SESSION_SECRET;

    if (!secret || secret.length < 32) {
        throw new Error('SESSION_SECRET must contain at least 32 characters.');
    }

    return secret;
}

function getSessionCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_DURATION_MS
    };
}

function createSessionToken(userId) {
    return jwt.sign({}, getSessionSecret(), {
        subject: String(userId),
        expiresIn: '7d'
    });
}

function readSessionToken(req) {
    const cookieHeader = req.headers.cookie || '';
    const sessionCookie = cookieHeader
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (!sessionCookie) {
        return null;
    }

    return sessionCookie.slice(SESSION_COOKIE_NAME.length + 1);
}

function clearSessionCookie(res) {
    const { maxAge, ...cookieOptions } = getSessionCookieOptions();
    res.clearCookie(SESSION_COOKIE_NAME, cookieOptions);
}

module.exports = {
    SESSION_COOKIE_NAME,
    createSessionToken,
    getSessionCookieOptions,
    getSessionSecret,
    readSessionToken,
    clearSessionCookie
};
