const { Pool } = require('@neondatabase/serverless');
require('dotenv').config()

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (err) => console.error(err));

module.exports = pool;