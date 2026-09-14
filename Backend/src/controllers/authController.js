const bcrypt = require('bcrypt');
const db = require('../config/database')

// Configura o custo computacional do bcrypt
const SALT_ROUNDS = 12;

// HTTP codes
// 200: user signed in
// 201: user registered
// 400: bad request
// 401: unauthorized
// 409: conflict
// 500: internal server error

// Registro de usuário
async function register(req, res) {
    // Variáveis de registro
    const { username, email, tipo, password } = req.body;

    // 1. Valida existência de variáveis
    if (!username || !email || !tipo || !password) {
        return res.status(400).json({
            error: 'Username, e-mail, tipo e senha são obrigatórios para registro.'
        });
    }

    if (
        typeof username !== 'string' ||
        typeof email !== 'string' ||
        typeof tipo !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            error: 'Os campos enviados possuem formato inválido.'
        });
    }

    // Normaliza registros para enviar ao DB
    const normalizedUsername = username.trim().toLowerCase(); // Unicidade depende de caixa alta/baixa
    const normalizedEmail = email.trim().toLowerCase();        // ^^
    const normalizedTipo = tipo.trim();

    if (!normalizedUsername || !normalizedEmail || !normalizedTipo) {
        return res.status(400).json({
            error: 'Username, e-mail e tipo não podem conter apenas espaços.'
        });
    }

    // 2. Valida segundo os limites de caractere definidos
    // Username
    if (normalizedUsername.length > 50) {
        return res.status(400).json({
            error: 'Username deve possuir no máximo 50 caracteres.'
        });
    }
    // Email
    if (normalizedEmail.length > 100) {
        return res.status(400).json({
            error: 'Email deve possuir no máximo 100 caracteres.'
        });
    }
    // Tipo
    if (normalizedTipo.length > 11) {
        return res.status(400).json({
            error: 'Tipo deve possuir no máximo 11 caracteres.'
        });
    }

    try {
        // 3. Gera hash de senha para o usuário
        const passwordHash = await bcrypt.hash(
            password,
            SALT_ROUNDS
        );

        // 4. Insere usuário
        const result = await db.query(
            `
            INSERT INTO users (
                username,
                email,
                tipo,
                password_hash
            )
            VALUES ($1, $2, $3, $4)
            RETURNING
                id,
                username,
                email,
                tipo,
                created_at
            `,
            [
                normalizedUsername,
                normalizedEmail,
                normalizedTipo,
                passwordHash
            ]
        );
        // 5. Retorna o usuário criado
        return res.status(201).json({
            message: 'Usuário criado com sucesso.',
            user: result.rows[0]
        });
    } catch (error) {

        // PostgreSQL: unique_violation -  garante unicidade de identificadores
        if (error.code === '23505') {
            return res.status(409).json({
                error: 'Username ou email já cadastrado.'
            });
        }
        // Descrição de quaisquer outro tipo de erro
        console.log('Erro ao registrar usuário: ', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

// Login de usuário
async function login(req, res) {
    // Variáveis de login
    const { identifier, password } = req.body;

    // 1. Valida existência de variáveis
    if (!identifier || !password) {
        return res.status(400).json({
            error: 'Identificador e senha são obrigatórios para login.'
        });
    }

    if (
        typeof identifier !== 'string' ||
        typeof password !== 'string'
    ) {
        return res.status(400).json({
            error: 'Identificador e senha possuem formato inválido.'
        });
    }

    // Normaliza identificador
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Verifica viabilidade de tamanho (máx. é email, <100)
    if (normalizedIdentifier.length > 100) {
        return res.status(400).json({
            error: 'Identificador deve possuir no máximo 100 caracteres.'
        })
    }

    if (!normalizedIdentifier) {
        return res.status(400).json({
            error: 'Identificador não pode conter apenas espaços.'
        });
    }

    try {
        // 2. Busca identificador em usernames/email
        const result = await db.query(
            `
            SELECT
                id,
                username,
                email,
                tipo,
                password_hash
            FROM users
            WHERE LOWER(username) = $1
                OR LOWER(email) = $1
            LIMIT 1
            `,
            [normalizedIdentifier]
        );

        // 3. Verifica existência de usuário
        // Triplo = significa estritamente igual (tipo de dado e valor)
        if (result.rows.length === 0) {
            return res.status(401).json({
                error: 'Identificador ou senha inválidos.'
            });
        }

        const user = result.rows[0];

        // 4. Valida senha
        const senhaValida = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!senhaValida) {
            return res.status(401).json({
                error: 'Identificador ou senha inválidos.'
            });
        }

        // 5. Login válido
        return res.status(200).json({
            message: 'Login efetuado. Seja bem-vindo!',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                tipo: user.tipo,
            }
        });
    } catch (error) {
        console.log('Não foi possível efetuar login: ', error);

        return res.status(500).json({
            error: 'Erro interno do Servidor.'
        })
    }
}

async function logout(req, res) {
}

async function getCurrentUser(req, res) {

}

module.exports = {
    register,
    login,
    logout,
    getCurrentUser
};