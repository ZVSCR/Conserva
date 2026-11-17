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
    const updates = {};

    // Mapeia o que vem do controller para as colunas reais da tabela
    if (fieldsToUpdate.push_notifications !== undefined) {
        updates.notify_push = fieldsToUpdate.push_notifications;
    }

    if (fieldsToUpdate.email_notifications !== undefined) {
        updates.notify_email = fieldsToUpdate.email_notifications;
    }

    if (fieldsToUpdate.dark_theme !== undefined) {
        updates.is_dark_theme = fieldsToUpdate.dark_theme;
    }

    // Se nenhum campo válido foi enviado, evita query inválida
    if (Object.keys(updates).length === 0) {
        return null;
    }

    updates.updated_at = new Date();

    const result = await sql`
        UPDATE users
        SET
            username = COALESCE(${username}, username),
            email = COALESCE(${email}, email),
            tipo = COALESCE(${tipo}, tipo),
            password_hash = COALESCE(${passwordHash}, password_hash),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, notify_push, notify_email, is_dark_theme, updated_at;
    `;

    return result[0];
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
    createUser
};
