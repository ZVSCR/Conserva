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

        // Retorna um array de linhas
        const [usuarioCriado] = await sql`
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

        throw error;
    }
}

async function loginRepo(user) {

    const { identifier } = user;

    const [usuarioBuscado] = await sql`
        SELECT
            id, username, email, tipo, password_hash
        FROM users
        WHERE LOWER(username) = ${identifier}
            OR LOWER(email) = ${identifier}
        LIMIT 1
    `;

    // Retorna null se não houver usuário, erro fica com o serviço
    return usuarioBuscado || null;
}

async function findUserByIdRepo(id) {
    const [usuario] = await sql`
        SELECT id, username, email, tipo
        FROM users
        WHERE id = ${id}
        LIMIT 1
    `;

    return usuario || null;
}

module.exports = {
    registerRepo,
    loginRepo,
    findUserByIdRepo
};