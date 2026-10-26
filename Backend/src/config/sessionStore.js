const session = require('express-session');
const PgSessionStore = require('connect-pg-simple')(session);
const pool = require('./transactionDatabase');

module.exports = function createSessionStore() {
    return new PgSessionStore({
        pool,
        tableName: 'user_sessions',
        createTableIfMissing: false,
        disableTouch: true
    });
};
