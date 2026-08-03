// ============================================
// Pool de conexion compartido a PostgreSQL (Neon)
// Todo el backend importa este archivo en vez de
// crear su propia conexion
// ============================================
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
