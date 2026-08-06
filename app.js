// ============================================
// App principal - MueblesCatalog
// ============================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const uploadRoutes = require('./routes/upload');
const homepageRoutes = require('./routes/homepage');

const app = express();
const oneDay = 24 * 60 * 60 * 1000;

app.use(helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            connectSrc: ["'self'"]
        }
    }
}));
app.use(cors());
app.use(express.json());

app.use(express.static('public', { maxAge: oneDay }));

app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/homepage', homepageRoutes);

app.get('/api/health', (req, res) => {
    res.json({ ok: true, mensaje: 'MueblesCatalog API funcionando' });
});

app.use((req, res) => {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

module.exports = app;
