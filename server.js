// ============================================
// Servidor principal - MueblesCatalog
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir el frontend estatico (carpeta public)
app.use(express.static('public'));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta de salud, util para verificar que el server esta vivo
app.get('/api/health', (req, res) => {
    res.json({ ok: true, mensaje: 'MueblesCatalog API funcionando' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
