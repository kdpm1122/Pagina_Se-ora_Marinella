// ============================================
// Rutas de productos (el catalogo de muebles)
// GET    /api/productos            -> publico, lista productos activos
// GET    /api/productos/:id        -> publico, detalle de un producto
// POST   /api/productos            -> solo admin, crear producto
// PUT    /api/productos/:id        -> solo admin, editar producto
// DELETE /api/productos/:id        -> solo admin, borrar producto (soft delete)
// POST   /api/productos/:id/vista  -> publico, registra una vista
// GET    /api/productos/stats/mas-vistos -> solo admin, top de vistos
// ============================================
const express = require('express');
const pool = require('../db/pool');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Listar productos activos (catalogo publico)
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT id, nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material, creado_en
             FROM productos
             WHERE activo = TRUE
             ORDER BY creado_en DESC`
        );
        res.json(resultado.rows);
    } catch (err) {
        console.error('Error listando productos:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// IMPORTANTE: esta ruta de estadisticas va ANTES de "/:id"
// para que Express no confunda "mas-vistos" con un id
router.get('/stats/mas-vistos', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT p.id, p.nombre, p.imagen_url, p.precio, COUNT(v.id) AS total_vistas
             FROM productos p
             LEFT JOIN vistas_producto v ON v.producto_id = p.id
             GROUP BY p.id
             ORDER BY total_vistas DESC
             LIMIT 10`
        );
        res.json(resultado.rows);
    } catch (err) {
        console.error('Error obteniendo estadisticas:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Detalle de un producto especifico
router.get('/:id', async (req, res) => {
    try {
        const resultado = await pool.query(
            'SELECT * FROM productos WHERE id = $1 AND activo = TRUE',
            [req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(resultado.rows[0]);
    } catch (err) {
        console.error('Error obteniendo producto:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Registrar una vista de producto (se llama cuando el cliente abre el detalle)
router.post('/:id/vista', async (req, res) => {
    try {
        await pool.query(
            'INSERT INTO vistas_producto (producto_id) VALUES ($1)',
            [req.params.id]
        );
        res.status(201).json({ ok: true });
    } catch (err) {
        console.error('Error registrando vista:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Crear producto (solo admin)
router.post('/', verificarToken, async (req, res) => {
    const { nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material } = req.body;

    if (!nombre || !nombre.trim()) {
        return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }
    if (nombre.trim().length > 150) {
        return res.status(400).json({ error: 'El nombre no puede superar 150 caracteres' });
    }
    if (!precio || isNaN(precio) || parseFloat(precio) <= 0) {
        return res.status(400).json({ error: 'El precio debe ser un numero mayor a cero' });
    }
    if (descripcion && descripcion.length > 2000) {
        return res.status(400).json({ error: 'La descripcion no puede superar 2000 caracteres' });
    }

    try {
        const resultado = await pool.query(
            `INSERT INTO productos (nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             RETURNING *`,
            [nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material, req.usuario.id]
        );
        res.status(201).json(resultado.rows[0]);
    } catch (err) {
        console.error('Error creando producto:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Editar producto (solo admin)
router.put('/:id', verificarToken, async (req, res) => {
    const { nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material } = req.body;

    try {
        const resultado = await pool.query(
            `UPDATE productos
             SET nombre = $1, descripcion = $2, precio = $3, categoria = $4,
                 imagen_url = $5, imagen_url_2 = $6, ancho_cm = $7, largo_cm = $8, alto_cm = $9, etiqueta = $10, color = $11, material = $12, actualizado_en = NOW()
             WHERE id = $13
             RETURNING *`,
            [nombre, descripcion, precio, categoria, imagen_url, imagen_url_2, ancho_cm, largo_cm, alto_cm, etiqueta, color, material, req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(resultado.rows[0]);
    } catch (err) {
        console.error('Error editando producto:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Borrar producto (soft delete: lo marca inactivo en vez de eliminarlo de la BD)
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const resultado = await pool.query(
            'UPDATE productos SET activo = FALSE WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ ok: true, id: resultado.rows[0].id });
    } catch (err) {
        console.error('Error borrando producto:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
