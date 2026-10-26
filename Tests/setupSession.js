// Somente os testes usam armazenamento em memória; a aplicação usa Neon.
process.env.SESSION_SECRET = 'chave-exclusiva-de-testes-com-mais-de-32-bytes';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';
process.env.SESSION_MAX_AGE_MS = '86400000';

jest.mock('../Backend/src/config/sessionStore', () => jest.fn(() => {
    const { MemoryStore } = require('express-session');
    return new MemoryStore();
}));
