const sql = require('../config/database');

// Buscar preferências do usuário
async function findPreferencesByUserId(userId) {
    const result = await sql`
        SELECT id, username, email, notify_push, notify_email, is_dark_theme
        FROM users
        WHERE id = ${userId};
    `;

    return result[0];
}

// Atualizar preferências no banco
async function updatePreferences(userId, fieldsToUpdate) {
    const notifyPush = fieldsToUpdate.notify_push ?? null;
    const notifyEmail = fieldsToUpdate.notify_email ?? null;
    const isDarkTheme = fieldsToUpdate.is_dark_theme ?? null;

    const result = await sql`
        UPDATE users
        SET
            notify_push = COALESCE(${notifyPush}, notify_push),
            notify_email = COALESCE(${notifyEmail}, notify_email),
            is_dark_theme = COALESCE(${isDarkTheme}, is_dark_theme),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, email, notify_push, notify_email, is_dark_theme, updated_at;
    `;

    return result[0] || null;
}

async function findUserDataById(userId) {
    const result = await sql`
        SELECT id, username, email, tipo
        FROM users
        WHERE id = ${userId};
    `;

    return result[0] || null;
}

async function updateUserData(userId, { username, email, tipo, passwordHash }) {
    const nextUsername = username ?? null;
    const nextEmail = email ?? null;
    const nextTipo = tipo ?? null;
    const nextPasswordHash = passwordHash ?? null;

    const result = await sql`
        UPDATE users
        SET
            username = COALESCE(${nextUsername}, username),
            email = COALESCE(${nextEmail}, email),
            tipo = COALESCE(${nextTipo}, tipo),
            password_hash = COALESCE(${nextPasswordHash}, password_hash),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, email, tipo;
    `;

    return result[0] || null;
}

// Criar novo usuário na tabela users
async function createUser({ username, email, password_hash, tipo = 'user' }) {
    const result = await sql`
        INSERT INTO users (username, email, tipo, password_hash)
        VALUES (${username}, ${email}, ${tipo}, ${password_hash})
        RETURNING id, username, email, tipo, created_at;
    `;

    return result[0];
}

module.exports = {
    findPreferencesByUserId,
    updatePreferences,
    findUserDataById,
    updateUserData,
    createUser
};
