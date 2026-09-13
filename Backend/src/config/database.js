const { Pool } = require('pg');

// Possibilita conexão backend & banco de dados
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = pool;