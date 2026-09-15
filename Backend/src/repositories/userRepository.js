const sql = require('../config/database');

async function findPreferencesByUserId(userId) {
    const result = await sql`
        SELECT notify_push, notify_email, is_dark_theme
        FROM users
        WHERE id = ${userId};
    `;

    return result[0];
}

async function updatePreferences(userId, fieldsToUpdate) {
    // Isola apenas as colunas que foram enviadas na requisição
    const updates = {};

    if (fieldsToUpdate.notify_push !== undefined) {
        updates.notify_push = fieldsToUpdate.notify_push;
    }

    if (fieldsToUpdate.notify_email !== undefined) {
        updates.notify_email = fieldsToUpdate.notify_email;
    }

    if (fieldsToUpdate.is_dark_theme !== undefined) {
        updates.is_dark_theme = fieldsToUpdate.is_dark_theme;
    }

    // Atualiza a coluna de timestamp
    updates.updated_at = new Date();

    const result = await sql`
        UPDATE users
        SET ${sql(updates)}
        WHERE id = ${userId}
        RETURNING notify_push, notify_email, is_dark_theme;
    `;

    return result[0];
}

module.exports = {
    findPreferencesByUserId,
    updatePreferences
};