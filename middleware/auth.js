// ============================================
// Middleware de autenticacion
// Verifica el token JWT enviado en el header
// "Authorization: Bearer <token>"
// Si es valido, agrega req.usuario con los datos del admin
// Si no, responde 401 (no autenticado)
// ============================================
const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = payload; // { id, email, rol }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalido o expirado' });
    }
}

module.exports = verificarToken;
