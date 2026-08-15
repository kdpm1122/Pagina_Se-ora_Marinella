async function cargarHomepageConfigPublic() {
    try {
        const respuesta = await fetch('/api/homepage');
        if (!respuesta.ok) {
            console.warn('No se pudo cargar la configuracion de portada.');
            return;
        }

        const config = await respuesta.json();

        const textos = [
            { selector: '#hero-badge', clave: 'hero_badge' },
            { selector: '#hero-title', clave: 'hero_title' },
            { selector: '#hero-text', clave: 'hero_text' },
            { selector: '#cta-principal', clave: 'hero_cta_main' },
            { selector: '#cta-whatsapp', clave: 'hero_cta_secondary' },
            { selector: '#categoria-dormitorios', clave: 'cat_dormitorios' },
            { selector: '#categoria-comedores', clave: 'cat_comedores' },
            { selector: '#categoria-salas', clave: 'cat_salas' },
            { selector: '#categoria-todas', clave: 'cat_todas' }
        ];

        textos.forEach(item => {
            const elemento = document.querySelector(item.selector);
            if (!elemento) return;
            const valor = config[item.clave];
            if (valor) {
                elemento.textContent = valor;
            }
        });

        const fondos = [
            { selector: '.tarjeta-dormitorios', clave: 'hero_rooms', gradient: 'linear-gradient(rgba(74,55,40,0.1), rgba(74,55,40,0.65))' },
            { selector: '.tarjeta-comedores', clave: 'hero_dining', gradient: 'linear-gradient(rgba(74,55,40,0.1), rgba(74,55,40,0.65))' },
            { selector: '.tarjeta-salas', clave: 'hero_living', gradient: 'linear-gradient(rgba(74,55,40,0.1), rgba(74,55,40,0.65))' },
            { selector: '.tarjeta-todas', clave: 'hero_all', gradient: 'linear-gradient(rgba(184,115,15,0.35), rgba(74,55,40,0.8))' }
        ];

        fondos.forEach(item => {
            const url = config[item.clave];
            const elemento = document.querySelector(item.selector);
            if (url && elemento) {
                elemento.style.backgroundImage = `${item.gradient}, url('${url}')`;
            }
        });
    } catch (err) {
        console.error('Error cargando homepage config pública:', err);
    }
}

document.addEventListener('DOMContentLoaded', cargarHomepageConfigPublic);
