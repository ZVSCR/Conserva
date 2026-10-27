// Somente o processo de testes recebe estes valores; nenhum .env é alterado.
process.env.SESSION_SECRET = 'chave-exclusiva-de-testes-com-mais-de-32-caracteres';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DATABASE_URL ||= 'postgresql://test:test@database.invalid/conservia_tests';
