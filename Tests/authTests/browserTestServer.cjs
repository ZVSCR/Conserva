// QA local: backend real, contas/estoques fictícios e sessões somente em memória.
// Não inicia index.js e substitui as conexões antes de carregar o aplicativo.
const path = require('node:path');
const { MemoryStore } = require('express-session');
const root = path.resolve(__dirname, '../..');
const users = [];
const store = new MemoryStore();

function replaceModule(relativePath, exports) {
    const filename = require.resolve(path.join(root, relativePath));
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

replaceModule('Backend/src/config/sessionStore.js', () => store);
replaceModule('Backend/src/config/transactionDatabase.js', {});
replaceModule('Backend/src/config/database.js', async (strings, ...values) => {
    const sql = strings.join('?');
    if (sql.includes('INSERT INTO users')) {
        if (users.some((user) => user.username === values[0] || user.email === values[1])) {
            const error = new Error('Conta de teste repetida');
            error.code = '23505';
            throw error;
        }
        const user = { id: users.length + 10, username: values[0], email: values[1], tipo: values[2], password_hash: values[3] };
        users.push(user);
        const { password_hash, ...publicUser } = user;
        return [publicUser];
    }
    if (sql.includes('LOWER(username)')) {
        return users.filter((user) => user.username === values[0] || user.email === values[0]);
    }
    if (sql.includes('SELECT notify_push')) {
        return [{ notify_push: false, notify_email: true, is_dark_theme: false }];
    }
    if (sql.includes('FROM users') && sql.includes('WHERE id')) {
        return users.filter((user) => user.id === values[0]).map(({ password_hash, ...user }) => user);
    }
    if (sql.includes('FROM estoque') && sql.includes('WHERE estoque.usuario_id')) {
        const user = users.find((user) => user.id === values[0]);
        return user ? [{ id: user.id * 10, item_id: user.id * 10, nome_item: `Item exclusivo de ${user.username}`, quantidade_disponivel: 2, quantidade_original: 3, tipo_medida: 'unitaria', unidade_de_medida: 'un' }] : [];
    }
    if (sql.includes('FROM receita_preparada') || sql.includes('FROM compra')) return [];
    throw new Error('Consulta fora do escopo do QA de login. Use apenas as telas documentadas.');
});

process.env.SESSION_SECRET = 'chave-temporaria-de-qa-local-sem-acesso-ao-banco';
process.env.FRONTEND_ORIGIN = 'http://localhost:5178';
process.env.SESSION_MAX_AGE_MS = '86400000';
process.env.NODE_ENV = 'development';
const app = require('../../Backend/src/app');
// Existe apenas neste processo de QA, para simular a expiração sem esperar 24h.
app.post('/__qa/expire-sessions', (_req, res) => store.clear(() => res.sendStatus(204)));
app.listen(3107, '127.0.0.1', () => console.log('QA: http://localhost:3107 (dados somente em memória)'));
