// QA local: backend real com JWT da main, contas e estoques somente em memória.
const path = require('node:path');
const jwt = require('jsonwebtoken');
const root = path.resolve(__dirname, '../..');
const users = [];

function replaceModule(relativePath, exports) {
    const filename = require.resolve(path.join(root, relativePath));
    require.cache[filename] = { id: filename, filename, loaded: true, exports };
}

replaceModule('Backend/src/config/transactionDatabase.js', {});
replaceModule('Backend/src/config/database.js', async (strings, ...values) => {
    const sql = strings.join('?');
    if (sql.includes('INSERT INTO users')) {
        if (users.some((user) => user.username === values[0] || user.email === values[1])) {
            const error = new Error('Conta de teste repetida');
            error.code = '23505';
            throw error;
        }
        const user = { id: users.length + 10, username: values[0], email: values[1], tipo: values[2], password_hash: values[3], notify_push: false, notify_email: true, is_dark_theme: false };
        users.push(user);
        const { password_hash, ...publicUser } = user;
        return [publicUser];
    }
    if (sql.includes('LOWER(')) return users.filter((user) => user[values[0] ? 'email' : 'username'] === values[1]);
    if (sql.includes('UPDATE users')) {
        const user = users.find((user) => user.id === values.at(-1));
        if (!user) return [];
        if (sql.includes('notify_push = CASE')) {
            ['notify_push', 'notify_email', 'is_dark_theme'].forEach((field, index) => {
                if (values[index * 2]) user[field] = values[index * 2 + 1];
            });
        } else {
            ['username', 'email', 'tipo', 'password_hash'].forEach((field, index) => {
                if (values[index] != null) user[field] = values[index];
            });
        }
        const { password_hash, ...publicUser } = user;
        return [publicUser];
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
process.env.FRONTEND_URL = 'http://localhost:5178';
process.env.NODE_ENV = 'development';
const app = require('../../Backend/src/app');
const { SESSION_COOKIE_NAME, getSessionCookieOptions } = require('../../Backend/src/config/session');
// Existe somente neste servidor de QA. Instala um JWT já expirado no navegador.
app.get('/__qa/expire-session', (_req, res) => {
    const token = jwt.sign({}, process.env.SESSION_SECRET, { subject: String(users[0]?.id ?? 10), expiresIn: -1 });
    res.cookie(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
    res.redirect('http://localhost:5178/home');
});
app.listen(3107, '127.0.0.1', () => console.log('QA JWT: http://localhost:3107 (dados somente em memória)'));
