const { neon } = require('@neondatabase/serverless');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

const sql = neon(process.env.DATABASE_URL);

module.exports = sql;