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
    const result = await sql`
        UPDATE users
        SET
            notify_push = CASE
                WHEN ${fieldsToUpdate.notify_push !== undefined}
                    THEN ${fieldsToUpdate.notify_push ?? null}
                ELSE notify_push
            END,
            notify_email = CASE
                WHEN ${fieldsToUpdate.notify_email !== undefined}
                    THEN ${fieldsToUpdate.notify_email ?? null}
                ELSE notify_email
            END,
            is_dark_theme = CASE
                WHEN ${fieldsToUpdate.is_dark_theme !== undefined}
                    THEN ${fieldsToUpdate.is_dark_theme ?? null}
                ELSE is_dark_theme
            END,
            updated_at = CURRENT_TIMESTAMP
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
