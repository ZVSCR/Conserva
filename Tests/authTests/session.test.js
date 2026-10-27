const jwt = require('jsonwebtoken');

const {
    SESSION_COOKIE_NAME,
    createSessionToken,
    getSessionCookieOptions
} = require('../../Backend/src/config/session');
const requireAuth = require('../../Backend/src/middleware/requireAuth');

describe('user session', () => {
    beforeEach(() => {
        process.env.SESSION_SECRET = 'test-secret-with-at-least-thirty-two-characters';
    });

    test('creates an HttpOnly cookie with a seven-day lifetime', () => {
        const options = getSessionCookieOptions();

        expect(options.httpOnly).toBe(true);
        expect(options.sameSite).toBe('lax');
        expect(options.maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    test('restores the authenticated user from the session cookie', () => {
        const token = createSessionToken(42);
        const req = {
            headers: {
                cookie: `${SESSION_COOKIE_NAME}=${token}`
            }
        };
        const res = {
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn()
        };
        const next = jest.fn();

        requireAuth(req, res, next);

        expect(req.user).toEqual({ id: 42 });
        expect(next).toHaveBeenCalledTimes(1);
        expect(jwt.verify(token, process.env.SESSION_SECRET).sub).toBe('42');
    });

    test('rejects and clears an expired or invalid session cookie', () => {
        const req = {
            headers: {
                cookie: `${SESSION_COOKIE_NAME}=invalid-token`
            }
        };
        const res = {
            set: jest.fn(),
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            clearCookie: jest.fn()
        };
        const next = jest.fn();

        requireAuth(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.clearCookie).toHaveBeenCalledWith(
            SESSION_COOKIE_NAME,
            expect.objectContaining({ httpOnly: true, path: '/' })
        );
        expect(next).not.toHaveBeenCalled();
    });
});
