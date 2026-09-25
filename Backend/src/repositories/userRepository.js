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

async function buscarGastosTotaisPorUsuario() {
    const result = await sql`
        SELECT 
            u.id, 
            u.username, 
            COALESCE(SUM(c.valor_total), 0) AS total_gasto
        FROM users u
        LEFT JOIN compra c ON u.id = c.usuario_id
        GROUP BY u.id, u.username
        ORDER BY total_gasto DESC;
    `;

    return result;
}

async function findUserDataById(userId) {
    const result = await sql`
        SELECT id, username, email, tipo, created_at, updated_at
        FROM users
        WHERE id = ${userId};
    `;

    return result[0];
}

async function updateUserData(userId, fieldsToUpdate) {
    const { username, email, tipo, passwordHash } = fieldsToUpdate;

    const result = await sql`
        UPDATE users
        SET
            username = COALESCE(${username}, username),
            email = COALESCE(${email}, email),
            tipo = COALESCE(${tipo}, tipo),
            password_hash = COALESCE(${passwordHash}, password_hash),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING id, username, email, tipo, created_at, updated_at;
    `;

    return result[0];
}

module.exports = {
    findPreferencesByUserId,
    updatePreferences,
    buscarGastosTotaisPorUsuario,
    updateUserData,
    findUserDataById
};