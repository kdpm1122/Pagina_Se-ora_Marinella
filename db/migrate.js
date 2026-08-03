// ============================================
// Script de migracion: crea las tablas en Neon
// Uso: node db/migrate.js
// ============================================
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrar() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('Conectando a la base de datos...');
    const client = await pool.connect();

    try {
        console.log('Ejecutando schema.sql...');
        await client.query(schemaSql);
        console.log('Tablas creadas correctamente: usuarios, productos, vistas_producto');
    } catch (err) {
        console.error('Error ejecutando la migracion:', err.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

migrar();
