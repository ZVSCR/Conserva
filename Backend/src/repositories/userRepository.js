const sql = require('../config/database');

async function findPreferencesByUserId(userId) {
    const result = await sql`
        SELECT push_notifications, email_notifications, dark_theme
        FROM users
        WHERE id = ${userId};
    `;

    return result[0];
}

async function updatePreferences(userId, fieldsToUpdate) {
    // Isola apenas as colunas que foram enviadas na requisição
    const updates = {};

    if (fieldsToUpdate.push_notifications !== undefined) {
        updates.push_notifications = fieldsToUpdate.push_notifications;
    }

    if (fieldsToUpdate.email_notifications !== undefined) {
        updates.email_notifications = fieldsToUpdate.email_notifications;
    }

    if (fieldsToUpdate.dark_theme !== undefined) {
        updates.dark_theme = fieldsToUpdate.dark_theme;
    }

    // Atualiza a coluna de timestamp
    updates.updated_at = new Date();

    const result = await sql`
        UPDATE users
        SET ${sql(updates)}
        WHERE id = ${userId}
        RETURNING push_notifications, email_notifications, dark_theme;
    `;

    return result[0];
}

module.exports = {
    findPreferencesByUserId,
    updatePreferences
};