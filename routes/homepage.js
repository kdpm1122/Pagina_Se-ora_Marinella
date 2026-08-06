const express = require('express');
const pool = require('../db/pool');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Obtener configuracion de portada
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT clave, valor FROM homepage_config'
        );
        const config = resultado.rows.reduce((acc, item) => {
            acc[item.clave] = item.valor;
            return acc;
        }, {});
        res.json(config);
    } catch (err) {
        console.error('Error obteniendo homepage config:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Editar una clave de portada (solo admin)
router.put('/:clave', verificarToken, async (req, res) => {
    const { clave } = req.params;
    const { valor } = req.body;

    if (!valor || typeof valor !== 'string') {
        return res.status(400).json({ error: 'Valor invalido' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO homepage_config (clave, valor)
             VALUES ($1, $2)
             ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor
             RETURNING *`,
            [clave, valor]
        );
        res.json(resultado.rows[0]);
    } catch (err) {
        console.error('Error guardando homepage config:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
