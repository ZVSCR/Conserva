const sql = require('../config/database');
const { AuthError } = require('../errors/AuthError');

async function registerRepo(user) {

    const {
        username,
        email,
        tipo,
        password_hash
    } = user;

    try {

        const usuarioCriado = await sql`
        INSERT INTO users (
            username, email, tipo, password_hash
        )
        VALUES (
            ${username},
            ${email},
            ${tipo},
            ${password_hash}
        )
        RETURNING
            id, username, email, tipo, created_at;
        `;

        if (!usuarioCriado) {
            throw new Error('Falha ao criar usuário: nenhum registro retornado.');
        }

        return usuarioCriado;

    } catch (error) {

        if (error.code === '23505') {
            throw new AuthError("Username ou email já cadastrados.", 409);
        }

        console.error('Erro em authRepository.registerRepo:', error);
        throw error;
    }
}

async function loginRepo(user) {

    const { identifier } = user;

    try {

        const buscaUsuario = await sql`
            SELECT
                id, username, email, tipo, password_hash
            FROM users
            WHERE LOWER(username) = ${identifier}
                OR LOWER(email) = ${identifier}
            LIMIT 1
        `;

        if (buscaUsuario.rows.length === 0) {
            throw new AuthError("Identificador ou senha inválidos.", 401);
        }

        const usuarioBuscado = buscaUsuario.rows[0];

        return usuarioBuscado;

    } catch (error) {

        console.error('Erro em authRepository.loginRepo:', error);
        throw error;
    }
}

module.exports = {
    registerRepo,
    loginRepo
};