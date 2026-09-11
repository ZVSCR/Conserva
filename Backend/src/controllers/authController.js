// Requerimentos para criptografia e acesso ao BD
const bycrypt = require('bycrypt');
const db = require('../config/database')

const SALT_ROUNDS = 12;

async function register(req, res) {
    const { username, email, tipo, password } = req.body; // Variáveis de registro

    // 1. Validação básica
    if (!username || !email || !tipo || !password) {
        return res.status(400).json({
            error: 'Username, tipo e senha são obrigatórios para registro.'
        });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = emai.trim().toLowerCase();
    const normalizedTipo = tipo.trim();

    // 2. Validação segundo os limites da tabela
    // 2.a Username
    if (normalizedUsername.length > 50) {
        return res.status(400).json({
            error: 'Username deve possuir no máximo 50 caracteres.'
        });
    }
    // 2.b Email
    if (normalizedEmail.length > 100) {
        return res.status(400).json({
            error: 'Email deve possuir no máximo 100 caracteres.'
        });
    }
    // 2.c Tipo
    if (normalizedEmail.tipo > 11) {
        return res.status(400).json({
            error: 'Tipo deve possuir no máximo 11 caracteres.'
        });
    }

    try {
        // 3. Gera hash de senha para o usuário
        const passwordHash = await bycrypt.hash(
            password,
            SALT_ROUNDS
        );

        // 4. Insere o usuário
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

        // PostgreSQL: unique_violation
        if (error.code == '23505') {
            return res.status(409).json({
                error: 'Username ou email já cadastrado.'
            });
        }

        console.log('Erro ao registrar usuário: ', error);

        return res.status(500).json({
            error: 'Erro interno do servidor.'
        });
    }
}

module.exports = {
    register
};