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

    const textoEtiqueta = { nuevo: 'Nuevo', mas_vendido: 'Más vendido' };

    contenedor.innerHTML = productos.map(p => `
        <div class="tarjeta-producto" data-id="${p.id}">
            <div class="tarjeta-producto-imagen-wrap">
                ${p.etiqueta && textoEtiqueta[p.etiqueta] ? `<span class="badge-etiqueta badge-${p.etiqueta}">${textoEtiqueta[p.etiqueta]}</span>` : ''}
                <img src="${p.imagen_url || '/img/sin-imagen.png'}" alt="${p.nombre}${p.categoria ? ' - ' + p.categoria : ''} - Muebles Marinella" data-imagen-color="1" loading="lazy">
            </div>
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
    llenarFiltroColor(productos);
    llenarFiltroMaterial(productos);
}

function llenarFiltroColor(productos) {
    const select = document.getElementById('filtro-color');
    if (!select) return;
    const colores = [...new Set(productos.map(p => p.color).filter(Boolean))];
    colores.forEach(color => {
        const opcion = document.createElement('option');
        opcion.value = color;
        opcion.textContent = color;
        select.appendChild(opcion);
    });
}

function llenarFiltroMaterial(productos) {
    const select = document.getElementById('filtro-material');
    if (!select) return;
    const materiales = [...new Set(productos.map(p => p.material).filter(Boolean))];
    materiales.forEach(material => {
        const opcion = document.createElement('option');
        opcion.value = material;
        opcion.textContent = material;
        select.appendChild(opcion);
    });
}

// --- Aplicar filtros de busqueda + categoria sobre el cache local ---
function configurarSliderPrecio(productos) {
    if (productos.length === 0) return;
    const precios = productos.map(p => parseFloat(p.precio));
    const min = Math.floor(Math.min(...precios) / 50000) * 50000;
    const max = Math.ceil(Math.max(...precios) / 50000) * 50000;

    const sliderMin = document.getElementById('precio-min');
    const sliderMax = document.getElementById('precio-max');

    [sliderMin, sliderMax].forEach(s => {
        s.min = min;
        s.max = max;
        s.step = 50000;
    });
    sliderMin.value = min;
    sliderMax.value = max;

    actualizarTextoRangoPrecio();
}

function actualizarTextoRangoPrecio() {
    const min = parseFloat(document.getElementById('precio-min').value);
    const max = parseFloat(document.getElementById('precio-max').value);
    document.getElementById('rango-precio-texto').textContent = `${formatearPrecio(min)} - ${formatearPrecio(max)}`;
}

function aplicarFiltros() {
    const texto = document.getElementById('buscador').value.toLowerCase().trim();
    const categoria = document.getElementById('filtro-categoria').value;
    const color = document.getElementById('filtro-color') ? document.getElementById('filtro-color').value : '';
    const material = document.getElementById('filtro-material') ? document.getElementById('filtro-material').value : '';
    const orden = document.getElementById('orden-productos').value;

    let precioMin = parseFloat(document.getElementById('precio-min').value);
    let precioMax = parseFloat(document.getElementById('precio-max').value);
    if (precioMin > precioMax) [precioMin, precioMax] = [precioMax, precioMin];

    actualizarTextoRangoPrecio();

    let filtrados = productosCache.filter(p => {
        const nombre = (p.nombre || '').toLowerCase();
        const descripcion = (p.descripcion || '').toLowerCase();
        const categoriaTexto = (p.categoria || '').toLowerCase();
        const colorTexto = (p.color || '').toLowerCase();
        const materialTexto = (p.material || '').toLowerCase();
        const coincideTexto = texto === '' || nombre.includes(texto) || descripcion.includes(texto) || categoriaTexto.includes(texto) || colorTexto.includes(texto) || materialTexto.includes(texto);
        const coincideCategoria = !categoria || p.categoria === categoria;
        const coincideColor = !color || p.color === color;
        const coincideMaterial = !material || p.material === material;
        const coincidePrecio = parseFloat(p.precio) >= precioMin && parseFloat(p.precio) <= precioMax;
        return coincideTexto && coincideCategoria && coincideColor && coincideMaterial && coincidePrecio;
    });

    if (orden === 'popularidad') {
        filtrados = filtrados.slice().sort((a, b) => {
            const popularA = a.etiqueta === 'mas_vendido' ? 1 : 0;
            const popularB = b.etiqueta === 'mas_vendido' ? 1 : 0;
            return popularB - popularA;
        });
    } else if (orden === 'precio-asc') {
        filtrados = filtrados.slice().sort((a, b) => a.precio - b.precio);
    } else if (orden === 'precio-desc') {
        filtrados = filtrados.slice().sort((a, b) => b.precio - a.precio);
    } else if (orden === 'nombre-asc') {
        filtrados = filtrados.slice().sort((a, b) => a.nombre.localeCompare(b.nombre));
    }

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
            <img id="carrusel-img" class="carrusel-img" src="${fotos[0] || '/img/sin-imagen.png'}" alt="${producto.nombre} - Foto del producto" loading="lazy">
            ${tieneVariasFotos ? `
                <button class="carrusel-flecha carrusel-flecha-izq" id="carrusel-anterior">&#8249;</button>
                <button class="carrusel-flecha carrusel-flecha-der" id="carrusel-siguiente">&#8250;</button>
                <div class="carrusel-puntos">
                    ${fotos.map((_, i) => `<span class="carrusel-punto ${i === 0 ? 'activo' : ''}" data-indice="${i}"></span>`).join('')}
                </div>
            ` : ''}
        </div>
        <h2 class="detalle-titulo">${producto.nombre}</h2>
        ${producto.categoria ? `<span class="categoria detalle-categoria">${producto.categoria}</span>` : ''}
        <p class="detalle-descripcion">${producto.descripcion || 'Sin descripción disponible.'}</p>
        ${(producto.ancho_cm || producto.largo_cm || producto.alto_cm) ? `
        <p class="detalle-medidas">
            Medidas: ${producto.ancho_cm || '-'} cm (ancho) x ${producto.largo_cm || '-'} cm (largo) x ${producto.alto_cm || '-'} cm (alto)
        </p>` : ''}
        <p class="precio detalle-precio">${formatearPrecio(producto.precio)}</p>
        <button class="btn-agregar" data-id="${producto.id}">Agregar al carrito</button>
        ${generarHtmlRelacionados(producto)}
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

function generarHtmlRelacionados(producto) {
    const relacionados = productosCache
        .filter(p => p.id !== producto.id && p.categoria === producto.categoria)
        .slice(0, 3);

    if (relacionados.length === 0) return '';

    return `
        <div class="relacionados">
            <h4>También te puede interesar</h4>
            <div class="relacionados-grid">
                ${relacionados.map(p => `
                    <div class="relacionado-item" data-id="${p.id}">
                        <img src="${p.imagen_url || '/img/sin-imagen.png'}" alt="${p.nombre}">
                        <p>${p.nombre}</p>
                        <span>${formatearPrecio(p.precio)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
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
        configurarSliderPrecio(productosCache);

        // Leemos el parametro ?categoria= de la URL (viene del index.html)
        // para preseleccionar el filtro al llegar desde una tarjeta de categoria
        const parametros = new URLSearchParams(window.location.search);
        const categoriaInicial = parametros.get('categoria');

        const breadcrumbActual = document.getElementById('breadcrumb-actual');
        if (categoriaInicial) {
            document.getElementById('filtro-categoria').value = categoriaInicial;
            breadcrumbActual.textContent = ` / ${categoriaInicial}`;
            document.title = `${categoriaInicial} - Muebles Marinella`;
            const metaDesc = document.querySelector('meta[property="og:description"]');
            if (metaDesc) metaDesc.setAttribute('content', `Explora nuestra colección de ${categoriaInicial.toLowerCase()}. Calidad y diseño para tu hogar.`);
            const metaTitle = document.querySelector('meta[property="og:title"]');
            if (metaTitle) metaTitle.setAttribute('content', `${categoriaInicial} - Muebles Marinella`);
            aplicarFiltros();
        } else {
            breadcrumbActual.textContent = ' / Todas las categorías';
            pintarProductos(productosCache);
        }

        const spinner = document.getElementById('spinner-carga');
        if (spinner) {
            spinner.remove();
        }
    } catch (err) {
        const catalogo = document.getElementById('catalogo');
        if (catalogo) {
            catalogo.innerHTML =
                '<div class="mensaje-error"><h3>No se pudieron cargar los muebles</h3><p>Intenta recargar la página o vuelve más tarde.</p><button id="btn-reintentar" class="btn-reintentar">Reintentar</button></div>';
            const botonReintentar = document.getElementById('btn-reintentar');
            if (botonReintentar) {
                botonReintentar.addEventListener('click', cargarProductos);
            }
        }
        console.error(err);
    }
}

// --- Eventos ---
document.addEventListener('DOMContentLoaded', () => {
    cargarProductos();

    document.getElementById('buscador').addEventListener('input', aplicarFiltros);
    document.getElementById('filtro-categoria').addEventListener('change', aplicarFiltros);
    const filtroColor = document.getElementById('filtro-color');
    if (filtroColor) filtroColor.addEventListener('change', aplicarFiltros);
    const filtroMaterial = document.getElementById('filtro-material');
    if (filtroMaterial) filtroMaterial.addEventListener('change', aplicarFiltros);
    document.getElementById('orden-productos').addEventListener('change', aplicarFiltros);
    document.getElementById('precio-min').addEventListener('input', aplicarFiltros);
    document.getElementById('precio-max').addEventListener('input', aplicarFiltros);

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

    // El boton "agregar" dentro del modal de detalle, y los productos relacionados
    document.getElementById('detalle-producto').addEventListener('click', (e) => {
        const btnAgregar = e.target.closest('.btn-agregar');
        const relacionado = e.target.closest('.relacionado-item');

        if (btnAgregar) {
            agregarAlCarrito(btnAgregar.dataset.id);
        } else if (relacionado) {
            abrirDetalleProducto(relacionado.dataset.id);
        }
    });
});
