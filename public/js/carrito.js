// ============================================
// Carrito de compras - persistido en localStorage
// No requiere login del cliente (segun lo definido)
// Al confirmar, genera un link de WhatsApp con el resumen
// ============================================

const CARRITO_KEY = 'muebles_carrito';
const NUMERO_WHATSAPP = '573001234567'; // TODO: cambiar por el numero real de la empresa

// --- Leer/guardar el carrito en localStorage ---
function obtenerCarrito() {
    const datos = localStorage.getItem(CARRITO_KEY);
    return datos ? JSON.parse(datos) : [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CARRITO_KEY, JSON.stringify(carrito));
    actualizarContadorCarrito();
}

// --- Agregar un producto al carrito (o sumar cantidad si ya existe) ---
function agregarAlCarrito(idProducto) {
    const producto = productosCache.find(p => p.id == idProducto);
    if (!producto) return;

    const carrito = obtenerCarrito();
    const itemExistente = carrito.find(item => item.id == idProducto);

    if (itemExistente) {
        itemExistente.cantidad += 1;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen_url: producto.imagen_url,
            descripcion: producto.descripcion || '',
            ancho_cm: producto.ancho_cm || null,
            largo_cm: producto.largo_cm || null,
            alto_cm: producto.alto_cm || null,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    mostrarNotificacion(`"${producto.nombre}" agregado al carrito`);
}

function cambiarCantidad(idProducto, delta) {
    const carrito = obtenerCarrito();
    const item = carrito.find(i => i.id == idProducto);
    if (!item) return;

    item.cantidad += delta;

    if (item.cantidad <= 0) {
        eliminarDelCarrito(idProducto, carrito);
        return;
    }

    guardarCarrito(carrito);
    pintarCarrito();
}

function eliminarDelCarrito(idProducto, carritoActual = null) {
    const carrito = (carritoActual || obtenerCarrito()).filter(i => i.id != idProducto);
    guardarCarrito(carrito);
    pintarCarrito();
}

// --- Actualizar el numero pequeño sobre el icono del carrito ---
function actualizarContadorCarrito() {
    const carrito = obtenerCarrito();
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    document.getElementById('contador-carrito').textContent = totalItems;
}

// --- Pintar el panel lateral del carrito ---
function pintarCarrito() {
    const carrito = obtenerCarrito();
    const contenedor = document.getElementById('items-carrito');

    if (carrito.length === 0) {
        contenedor.innerHTML = '<p style="padding:1rem 0;">Tu carrito está vacío.</p>';
        document.getElementById('total-carrito').textContent = formatearPrecio(0);
        return;
    }

    contenedor.innerHTML = carrito.map(item => {
        const tieneMedidas = item.ancho_cm || item.largo_cm || item.alto_cm;
        return `
        <div class="item-carrito" data-id="${item.id}">
            <img src="${item.imagen_url || '/img/sin-imagen.png'}" alt="${item.nombre}">
            <div class="item-carrito-info">
                <h4>${item.nombre}</h4>
                ${item.descripcion ? `<p class="item-carrito-descripcion">${item.descripcion}</p>` : ''}
                ${tieneMedidas ? `<p class="item-carrito-medidas">${item.ancho_cm || '-'} x ${item.largo_cm || '-'} x ${item.alto_cm || '-'} cm</p>` : ''}
                <p class="item-carrito-precio">${formatearPrecio(item.precio)}</p>
                <div class="item-carrito-controles">
                    <button class="btn-restar" data-id="${item.id}">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-sumar" data-id="${item.id}">+</button>
                </div>
            </div>
            <button class="btn-eliminar-item" data-id="${item.id}">&times;</button>
        </div>
    `;
    }).join('');

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    document.getElementById('total-carrito').textContent = formatearPrecio(total);
}

// --- Generar el mensaje de WhatsApp y abrir el chat ---
function confirmarPedidoPorWhatsapp() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío');
        return;
    }

    let mensaje = 'Hola, quiero hacer la siguiente cotización de este pedido:%0A%0A';

    carrito.forEach(item => {
        mensaje += `• ${item.nombre} x${item.cantidad} - ${formatearPrecio(item.precio * item.cantidad)}%0A`;
    });

    const total = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    mensaje += `%0ATotal: ${formatearPrecio(total)}`;

    const url = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensaje}`;
    window.open(url, '_blank');
}

// --- Notificacion simple tipo "toast" (se auto-oculta) ---
function mostrarNotificacion(texto) {
    let toast = document.getElementById('toast-notificacion');

    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notificacion';
        toast.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background-color: #4a3728; color: white; padding: 0.8rem 1.5rem;
            border-radius: 8px; z-index: 200; font-size: 0.9rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = texto;
    toast.style.opacity = '1';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
    }, 2500);
}

// --- Eventos del carrito ---
document.addEventListener('DOMContentLoaded', () => {
    actualizarContadorCarrito();

    // Configurar el boton flotante de WhatsApp (si existe en esta pagina)
    const botonFlotante = document.getElementById('whatsapp-flotante');
    if (botonFlotante) {
        const mensajeBienvenida = encodeURIComponent('Hola, estoy interesado en sus muebles. ¿Me pueden dar más información?');
        botonFlotante.href = `https://wa.me/${NUMERO_WHATSAPP}?text=${mensajeBienvenida}`;
    }

    document.getElementById('btn-carrito').addEventListener('click', () => {
        pintarCarrito();
        document.getElementById('panel-carrito').classList.remove('oculto');
        document.getElementById('overlay').classList.remove('oculto');
    });

    document.getElementById('cerrar-carrito').addEventListener('click', cerrarModales);
    document.getElementById('btn-whatsapp').addEventListener('click', confirmarPedidoPorWhatsapp);

    // Delegacion de eventos para los botones +/- y eliminar dentro del carrito
    document.getElementById('items-carrito').addEventListener('click', (e) => {
        const btnSumar = e.target.closest('.btn-sumar');
        const btnRestar = e.target.closest('.btn-restar');
        const btnEliminar = e.target.closest('.btn-eliminar-item');

        if (btnSumar) cambiarCantidad(btnSumar.dataset.id, 1);
        else if (btnRestar) cambiarCantidad(btnRestar.dataset.id, -1);
        else if (btnEliminar) eliminarDelCarrito(btnEliminar.dataset.id);
    });
});
