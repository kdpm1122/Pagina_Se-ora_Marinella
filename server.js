// ============================================
// Servidor principal - MueblesCatalog
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
// crossOriginResourcePolicy en false porque servimos imagenes de Cloudinary/Unsplash
// desde dominios externos, y helmet por defecto podria bloquear esos recursos
app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors());
app.use(express.json());

// Servir el frontend estatico (carpeta public) con cache de 1 día
const oneDay = 24 * 60 * 60 * 1000;
app.use(express.static('public', { maxAge: oneDay }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/upload', uploadRoutes);

// Ruta de salud, util para verificar que el server esta vivo
app.get('/api/health', (req, res) => {
    res.json({ ok: true, mensaje: 'MueblesCatalog API funcionando' });
});

// Si ninguna ruta coincidio (ni API ni archivo estatico), servimos el 404 personalizado
app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
