// ============================================
// Script para crear el primer usuario admin
// Uso: node db/seed-admin.js "Nombre" "email@correo.com" "contraseña"
// ============================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function crearAdmin() {
    const [nombre, email, password] = process.argv.slice(2);

    if (!nombre || !email || !password) {
        console.error('Uso: node db/seed-admin.js "Nombre" "email@correo.com" "contraseña"');
        process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
        const resultado = await pool.query(
            `INSERT INTO usuarios (nombre, email, password_hash, rol)
             VALUES ($1, $2, $3, 'admin')
             ON CONFLICT (email) DO UPDATE SET password_hash = $3
             RETURNING id, nombre, email, rol`,
            [nombre, email, passwordHash]
        );
        console.log('Usuario admin creado/actualizado:', resultado.rows[0]);
    } catch (err) {
        console.error('Error creando admin:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

crearAdmin();
