const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const sql = neon(process.env.DATABASE_URL);

module.exports = sql;
