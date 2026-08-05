// ============================================
// Catalogo - trae productos de la API y los pinta
// Maneja busqueda, filtro por categoria, y el modal de detalle
// ============================================

const API_URL = '/api/productos';

let productosCache = []; // guardamos todos los productos para filtrar sin volver a pedir a la API

// --- Formatear precio como moneda ---
function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// --- Pintar las tarjetas de producto en el catalogo ---
function pintarProductos(productos) {
    const contenedor = document.getElementById('catalogo');
    const contadorEl = document.getElementById('contador-resultados');
    if (contadorEl) {
        contadorEl.textContent = `Mostrando ${productos.length} de ${productosCache.length} productos`;
    }

    if (productos.length === 0) {
        contenedor.innerHTML = '<p id="mensaje-carga">No se encontraron muebles con ese criterio.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(p => `
        <div class="tarjeta-producto" data-id="${p.id}">
            <img src="${p.imagen_url || '/img/sin-imagen.png'}" alt="${p.nombre}" data-imagen-color="1" loading="lazy">
            <div class="tarjeta-producto-info">
                ${p.categoria ? `<span class="categoria">${p.categoria}</span>` : ''}
                <h3>${p.nombre}</h3>
                <p class="precio">${formatearPrecio(p.precio)}</p>
                <button class="btn-agregar" data-id="${p.id}">Agregar al carrito</button>
            </div>
        </div>
    `).join('');

    // Aplicamos el color de fondo dinamico a cada imagen recien pintada
    document.querySelectorAll('img[data-imagen-color]').forEach(img => {
        img.style.backgroundColor = '#f0e4d3';
        obtenerColorDominante(img).then(color => {
            img.style.backgroundColor = color;
        });
    });
}

// --- Llenar el select de categorias con las categorias unicas que existan ---
function llenarFiltroCategorias(productos) {
    const select = document.getElementById('filtro-categoria');
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];

    categorias.forEach(cat => {
        const opcion = document.createElement('option');
        opcion.value = cat;
        opcion.textContent = cat;
        select.appendChild(opcion);
    });
}

// --- Aplicar filtros de busqueda + categoria sobre el cache local ---
function aplicarFiltros() {
    const texto = document.getElementById('buscador').value.toLowerCase().trim();
    const categoria = document.getElementById('filtro-categoria').value;

    const filtrados = productosCache.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(texto) ||
                               (p.descripcion || '').toLowerCase().includes(texto);
        const coincideCategoria = !categoria || p.categoria === categoria;
        return coincideTexto && coincideCategoria;
    });

    pintarProductos(filtrados);
}

// --- Abrir el modal de detalle de un producto y registrar la vista ---
async function abrirDetalleProducto(id) {
    const producto = productosCache.find(p => p.id == id);
    if (!producto) return;

    const detalle = document.getElementById('detalle-producto');

    const fotos = [producto.imagen_url, producto.imagen_url_2].filter(Boolean);
    const tieneVariasFotos = fotos.length > 1;

    detalle.innerHTML = `
        <div class="carrusel-detalle" data-indice="0">
            <img id="carrusel-img" src="${fotos[0] || '/img/sin-imagen.png'}" alt="${producto.nombre}"
                 style="width:100%; height:300px; object-fit:contain; border-radius:8px; background-color:#f0e4d3;">
            ${tieneVariasFotos ? `
                <button class="carrusel-flecha carrusel-flecha-izq" id="carrusel-anterior">&#8249;</button>
                <button class="carrusel-flecha carrusel-flecha-der" id="carrusel-siguiente">&#8250;</button>
                <div class="carrusel-puntos">
                    ${fotos.map((_, i) => `<span class="carrusel-punto ${i === 0 ? 'activo' : ''}" data-indice="${i}"></span>`).join('')}
                </div>
            ` : ''}
        </div>
        <h2 style="margin-top:1rem;">${producto.nombre}</h2>
        ${producto.categoria ? `<span class="categoria">${producto.categoria}</span>` : ''}
        <p style="margin:1rem 0;">${producto.descripcion || 'Sin descripción disponible.'}</p>
        ${(producto.ancho_cm || producto.largo_cm || producto.alto_cm) ? `
        <p style="color:#8b5e3c; font-size:0.9rem; margin-bottom:0.5rem;">
            Medidas: ${producto.ancho_cm || '-'} cm (ancho) x ${producto.largo_cm || '-'} cm (largo) x ${producto.alto_cm || '-'} cm (alto)
        </p>` : ''}
        <p class="precio" style="font-size:1.5rem;">${formatearPrecio(producto.precio)}</p>
        <button class="btn-agregar" data-id="${producto.id}">Agregar al carrito</button>
    `;

    document.getElementById('modal-producto').classList.remove('oculto');
    document.getElementById('overlay').classList.remove('oculto');

    // Calculamos el color de fondo que combine con la foto actual
    const imgCarrusel = document.getElementById('carrusel-img');
    imgCarrusel.style.backgroundColor = '#f0e4d3'; // beige mientras se calcula
    obtenerColorDominante(imgCarrusel).then(color => {
        imgCarrusel.style.backgroundColor = color;
    });

    // Logica del carrusel: cambiar de foto con las flechas o los puntos
    if (tieneVariasFotos) {
        const carruselDiv = document.querySelector('.carrusel-detalle');
        const imgEl = document.getElementById('carrusel-img');

        function mostrarFoto(indice) {
            const indiceCircular = ((indice % fotos.length) + fotos.length) % fotos.length;
            imgEl.src = fotos[indiceCircular];
            carruselDiv.dataset.indice = indiceCircular;

            obtenerColorDominante(imgEl).then(color => {
                imgEl.style.backgroundColor = color;
            });

            document.querySelectorAll('.carrusel-punto').forEach((punto, i) => {
                punto.classList.toggle('activo', i === indiceCircular);
            });
        }

        document.getElementById('carrusel-anterior').addEventListener('click', () => {
            mostrarFoto(parseInt(carruselDiv.dataset.indice) - 1);
        });

        document.getElementById('carrusel-siguiente').addEventListener('click', () => {
            mostrarFoto(parseInt(carruselDiv.dataset.indice) + 1);
        });

        document.querySelectorAll('.carrusel-punto').forEach(punto => {
            punto.addEventListener('click', () => mostrarFoto(parseInt(punto.dataset.indice)));
        });
    }

    // Registrar la vista en segundo plano (no bloqueamos la interfaz por esto)
    fetch(`${API_URL}/${id}/vista`, { method: 'POST' }).catch(err => {
        console.warn('No se pudo registrar la vista:', err.message);
    });
}

function cerrarModales() {
    document.getElementById('modal-producto').classList.add('oculto');
    document.getElementById('panel-carrito').classList.add('oculto');
    document.getElementById('overlay').classList.add('oculto');
}

// --- Cargar productos al iniciar la pagina ---
async function cargarProductos() {
    try {
        const respuesta = await fetch(API_URL);
        if (!respuesta.ok) throw new Error('Error al obtener productos');

        productosCache = await respuesta.json();
        llenarFiltroCategorias(productosCache);

        // Leemos el parametro ?categoria= de la URL (viene del index.html)
        // para preseleccionar el filtro al llegar desde una tarjeta de categoria
        const parametros = new URLSearchParams(window.location.search);
        const categoriaInicial = parametros.get('categoria');

        const breadcrumbActual = document.getElementById('breadcrumb-actual');
        if (categoriaInicial) {
            document.getElementById('filtro-categoria').value = categoriaInicial;
            breadcrumbActual.textContent = ` / ${categoriaInicial}`;
            aplicarFiltros();
        } else {
            breadcrumbActual.textContent = ' / Todas las categorías';
            pintarProductos(productosCache);
        }
    } catch (err) {
        document.getElementById('catalogo').innerHTML =
            '<p id="mensaje-carga">No se pudieron cargar los muebles. Intenta recargar la página.</p>';
        console.error(err);
    }
}

// --- Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    document.getElementById('buscador').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);

    document.getElementById('overlay').addEventListener('click', cerrarModales);
    document.getElementById('cerrar-modal-producto').addEventListener('click', cerrarModales);

    // Delegacion de eventos: escuchamos clicks en todo el catalogo
    // para no tener que re-asignar eventos cada vez que se repinta
    document.getElementById('catalogo').addEventListener('click', (e) => {
        const tarjeta = e.target.closest('.tarjeta-producto');
        const btnAgregar = e.target.closest('.btn-agregar');

        if (btnAgregar) {
            e.stopPropagation();
            agregarAlCarrito(btnAgregar.dataset.id);
        } else if (tarjeta) {
            abrirDetalleProducto(tarjeta.dataset.id);
        }
    });

    // El boton "agregar" dentro del modal de detalle
    document.getElementById('detalle-producto').addEventListener('click', (e) => {
        const btnAgregar = e.target.closest('.btn-agregar');
        if (btnAgregar) agregarAlCarrito(btnAgregar.dataset.id);
    });
});
