// ============================================
// Ruta de subida de imagenes (solo admin)
// POST /api/upload -> recibe un archivo, lo sube a Cloudinary
//                      y devuelve la URL publica
// ============================================
const express = require('express');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const verificarToken = require('../middleware/auth');

const router = express.Router();

// Guardamos el archivo en memoria (no en disco) porque en Vercel
// no hay almacenamiento persistente entre peticiones
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // maximo 5MB por imagen
    fileFilter: (req, file, cb) => {
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
        if (tiposPermitidos.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imagenes JPG, PNG o WEBP'));
        }
    }
});

router.post('/', verificarToken, upload.single('imagen'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    try {
        // Convertimos el buffer en memoria a un formato que Cloudinary acepta (base64 data URI)
        const base64 = req.file.buffer.toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${base64}`;

        const resultado = await cloudinary.uploader.upload(dataUri, {
            folder: 'muebles-marinella', // carpeta dentro de Cloudinary para organizar
            resource_type: 'image'
        });

        res.json({ url: resultado.secure_url });
    } catch (err) {
        console.error('Error subiendo imagen a Cloudinary:', err.message);
        res.status(500).json({ error: 'Error subiendo la imagen' });
    }
});

module.exports = router;
