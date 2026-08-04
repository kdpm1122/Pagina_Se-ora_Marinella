// ============================================
// Extraccion de color dominante de una imagen
// Se usa para que el fondo del recuadro (donde la foto
// no llena todo el espacio) combine con los colores de la foto
// en vez de usar siempre el mismo beige fijo
// ============================================

function obtenerColorDominante(imgElement) {
    return new Promise((resolve) => {
        try {
            const canvas = document.createElement('canvas');
            const contexto = canvas.getContext('2d');

            // Reducimos la imagen a un tamaño chico para que el analisis sea rapido
            const tamano = 20;
            canvas.width = tamano;
            canvas.height = tamano;

            const imgTemporal = new Image();
            imgTemporal.crossOrigin = 'Anonymous'; // necesario para leer pixeles de Cloudinary/Unsplash
            imgTemporal.src = imgElement.src;

            imgTemporal.onload = () => {
                contexto.drawImage(imgTemporal, 0, 0, tamano, tamano);

                let r = 0, g = 0, b = 0, total = 0;

                try {
                    const datos = contexto.getImageData(0, 0, tamano, tamano).data;
                    for (let i = 0; i < datos.length; i += 4) {
                        r += datos[i];
                        g += datos[i + 1];
                        b += datos[i + 2];
                        total++;
                    }
                    r = Math.round(r / total);
                    g = Math.round(g / total);
                    b = Math.round(b / total);

                    // Aclaramos el color (mezclado con blanco) para que sirva de fondo suave,
                    // no un color plano intenso que compita con la foto
                    const factorAclarado = 0.75;
                    r = Math.round(r + (255 - r) * factorAclarado);
                    g = Math.round(g + (255 - g) * factorAclarado);
                    b = Math.round(b + (255 - b) * factorAclarado);

                    resolve(`rgb(${r}, ${g}, ${b})`);
                } catch (err) {
                    // Si la imagen bloquea la lectura de pixeles (CORS), usamos el beige por defecto
                    resolve('#f0e4d3');
                }
            };

            imgTemporal.onerror = () => resolve('#f0e4d3');
        } catch (err) {
            resolve('#f0e4d3');
        }
    });
}
