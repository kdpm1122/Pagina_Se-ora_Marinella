// ============================================
// Panel de administracion
// Login, CRUD de productos, y estadisticas de mas vistos
// ============================================

const TOKEN_KEY = 'muebles_admin_token';
const USUARIO_KEY = 'muebles_admin_usuario';

// --- Helpers de sesion ---
function guardarSesion(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

function obtenerToken() {
    return localStorage.getItem(TOKEN_KEY);
}

function obtenerUsuario() {
    const datos = localStorage.getItem(USUARIO_KEY);
    return datos ? JSON.parse(datos) : null;
}

function cerrarSesion() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USUARIO_KEY);
    mostrarVistaLogin();
}

// --- Formatear precio (igual que en el catalogo publico) ---
function formatearPrecio(valor) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
}

// --- Cambiar entre vista de login y vista del panel ---
function mostrarVistaLogin() {
    document.getElementById('vista-login').classList.remove('oculto');
    document.getElementById('vista-panel').classList.add('oculto');
}

function mostrarVistaPanel() {
    const usuario = obtenerUsuario();
    document.getElementById('vista-login').classList.add('oculto');
    document.getElementById('vista-panel').classList.remove('oculto');
    document.getElementById('admin-nombre').textContent = usuario ? usuario.nombre : '';
    cargarProductosAdmin();
}

async function cargarDashboardMetrics() {
    const productos = productosAdminCache.length ? productosAdminCache : [];
    document.getElementById('card-total-productos').textContent = productos.length;
    document.getElementById('card-sin-imagen').textContent = productos.filter(p => !p.imagen_url).length;

    try {
        const respuesta = await peticionAutenticada('/api/productos/stats/mas-vistos');
        const stats = await respuesta.json();
        const totalVistas = stats.reduce((sum, item) => sum + Number(item.total_vistas || 0), 0);
        document.getElementById('card-total-vistas').textContent = totalVistas;
        document.getElementById('card-top-producto').textContent = stats.length ? stats[0].nombre : 'Sin datos';
    } catch (err) {
        document.getElementById('card-total-vistas').textContent = '0';
        document.getElementById('card-top-producto').textContent = 'Sin datos';
    }
}

// --- Peticion generica autenticada, maneja el caso de token vencido ---
async function peticionAutenticada(url, opciones = {}) {
    const token = obtenerToken();
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(opciones.headers || {})
        }
    });

    if (respuesta.status === 401) {
        alert('Tu sesión expiró, por favor inicia sesión de nuevo.');
        cerrarSesion();
        throw new Error('Sesión expirada');
    }

    return respuesta;
}


// --- Subir la imagen seleccionada a Cloudinary (via nuestro backend) ---
async function subirImagen(archivo) {
    const formData = new FormData();
    formData.append('imagen', archivo);

    const token = obtenerToken();
    const respuesta = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(resultado.error || 'Error subiendo la imagen');
    }

    return resultado.url;
}

// --- Login ---
async function iniciarSesion(email, password) {
    const errorEl = document.getElementById('login-error');
    errorEl.classList.add('oculto');

    try {
        const respuesta = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            errorEl.textContent = datos.error || 'Credenciales inválidas';
            errorEl.classList.remove('oculto');
            return;
        }

        guardarSesion(datos.token, datos.usuario);
        mostrarVistaPanel();
    } catch (err) {
        errorEl.textContent = 'Error de conexión con el servidor';
        errorEl.classList.remove('oculto');
        console.error(err);
    }
}

// --- Cargar y pintar la lista de productos en la tabla ---
let productosAdminCache = [];

function pintarTablaProductos(productos) {
    const contenedor = document.getElementById('tabla-productos');

    if (productos.length === 0) {
        contenedor.innerHTML = '<p style="padding:1.5rem;">No se encontraron productos.</p>';
        return;
    }

    contenedor.innerHTML = productos.map(p => `
            <div class="fila-producto">
                <img src="${p.imagen_url || '/img/sin-imagen.png'}" alt="${p.nombre}">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small>${p.categoria || 'Sin categoría'}</small>
                </div>
                <div>${formatearPrecio(p.precio)}</div>
                <div></div>
                <div class="acciones">
                    <button class="btn-editar" data-id="${p.id}">Editar</button>
                    <button class="btn-borrar" data-id="${p.id}">Borrar</button>
                </div>
            </div>
        `).join('');
}

async function cargarProductosAdmin() {
    const contenedor = document.getElementById('tabla-productos');
    try {
        const respuesta = await fetch('/api/productos');
        productosAdminCache = await respuesta.json();
        pintarTablaProductos(productosAdminCache);
        actualizarDashboardMetrics();
        await cargarDashboardMetrics();
    } catch (err) {
        contenedor.innerHTML = '<p style="padding:1.5rem;">Error cargando productos.</p>';
        console.error(err);
    }
}

function filtrarProductosAdmin() {
    const texto = document.getElementById('admin-buscador').value.toLowerCase().trim();
    const filtrados = productosAdminCache.filter(p => p.nombre.toLowerCase().includes(texto));
    pintarTablaProductos(filtrados);
}

function actualizarDashboardMetrics() {
    const productos = productosAdminCache.length ? productosAdminCache : [];
    document.getElementById('card-total-productos').textContent = productos.length;
    document.getElementById('card-sin-imagen').textContent = productos.filter(p => !p.imagen_url).length;
}

// --- Abrir el modal de formulario, vacio (nuevo) o lleno (editar) ---
async function abrirFormularioProducto(idProducto = null) {
    document.getElementById('form-producto').reset();
    document.getElementById('form-producto-error').classList.add('oculto');
    document.getElementById('producto-id').value = '';

    if (idProducto) {
        document.getElementById('titulo-form-producto').textContent = 'Editar producto';
        const respuesta = await fetch(`/api/productos/${idProducto}`);
        const producto = await respuesta.json();

        document.getElementById('producto-id').value = producto.id;
        document.getElementById('producto-nombre').value = producto.nombre;
        document.getElementById('producto-descripcion').value = producto.descripcion || '';
        document.getElementById('producto-precio').value = producto.precio;
        document.getElementById('producto-categoria').value = producto.categoria || '';
        document.getElementById('producto-imagen').value = producto.imagen_url || '';
        document.getElementById('producto-imagen-2').value = producto.imagen_url_2 || '';
        document.getElementById('producto-ancho').value = producto.ancho_cm || '';
        document.getElementById('producto-largo').value = producto.largo_cm || '';
        document.getElementById('producto-alto').value = producto.alto_cm || '';
        document.getElementById('producto-etiqueta').value = producto.etiqueta || '';
    } else {
        document.getElementById('titulo-form-producto').textContent = 'Nuevo producto';
    }

    document.getElementById('modal-form-producto').classList.remove('oculto');
    document.getElementById('overlay').classList.remove('oculto');
}

function cerrarModales() {
    document.getElementById('modal-form-producto').classList.add('oculto');
    document.getElementById('overlay').classList.add('oculto');
}

// --- Guardar producto (crear o editar segun si hay id) ---
async function guardarProducto(datos, idProducto) {
    const errorEl = document.getElementById('form-producto-error');
    errorEl.classList.add('oculto');

    const url = idProducto ? `/api/productos/${idProducto}` : '/api/productos';
    const metodo = idProducto ? 'PUT' : 'POST';

    try {
        const respuesta = await peticionAutenticada(url, {
            method: metodo,
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            errorEl.textContent = resultado.error || 'Error guardando el producto';
            errorEl.classList.remove('oculto');
            return;
        }

        cerrarModales();
        cargarProductosAdmin();
    } catch (err) {
        console.error(err);
    }
}

// --- Borrar producto ---
async function borrarProducto(idProducto) {
    if (!confirm('¿Seguro que quieres borrar este producto? Dejará de verse en el catálogo.')) return;

    try {
        await peticionAutenticada(`/api/productos/${idProducto}`, { method: 'DELETE' });
        cargarProductosAdmin();
    } catch (err) {
        console.error(err);
    }
}

// --- Cargar y pintar las estadisticas de mas vistos ---
async function cargarStats() {
    const contenedor = document.getElementById('lista-stats');
    try {
        const respuesta = await peticionAutenticada('/api/productos/stats/mas-vistos');
        const stats = await respuesta.json();

        if (stats.length === 0) {
            contenedor.innerHTML = '<p style="padding:1.5rem;">Todavía no hay vistas registradas.</p>';
            return;
        }

        contenedor.innerHTML = stats.map((p, i) => `
            <div class="fila-stat">
                <div class="posicion">${i + 1}</div>
                <img src="${p.imagen_url || '/img/sin-imagen.png'}" alt="${p.nombre}">
                <div>
                    <strong>${p.nombre}</strong><br>
                    <small>${formatearPrecio(p.precio)}</small>
                </div>
                <div class="total-vistas">${p.total_vistas} vistas</div>
            </div>
        `).join('');
    } catch (err) {
        contenedor.innerHTML = '<p style="padding:1.5rem;">Error cargando estadísticas.</p>';
        console.error(err);
    }
}

// --- Cambiar de tab (Productos / Mas vistos) ---
function cambiarTab(nombreTab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('activo', btn.dataset.tab === nombreTab);
    });
    document.getElementById('tab-productos').classList.toggle('oculto', nombreTab !== 'productos');
    document.getElementById('tab-stats').classList.toggle('oculto', nombreTab !== 'stats');

    if (nombreTab === 'stats') cargarStats();
}

// --- Inicializacion ---
document.addEventListener('DOMContentLoaded', () => {
    // Si ya hay sesion guardada, entra directo al panel
    if (obtenerToken()) {
        mostrarVistaPanel();
    } else {
        mostrarVistaLogin();
    }

    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().normalize('NFC');
        const password = document.getElementById('login-password').value.trim();
        iniciarSesion(email, password);
    });

    document.getElementById('btn-logout').addEventListener('click', cerrarSesion);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => cambiarTab(btn.dataset.tab));
    });

    document.getElementById('btn-nuevo-producto').addEventListener('click', () => abrirFormularioProducto());
    document.getElementById('admin-buscador').addEventListener('input', filtrarProductosAdmin);
    document.getElementById('cerrar-modal-form').addEventListener('click', cerrarModales);
    document.getElementById('overlay').addEventListener('click', cerrarModales);

    document.getElementById('form-producto').addEventListener('submit', async (e) => {
        e.preventDefault();
        const idProducto = document.getElementById('producto-id').value;
        const archivo = document.getElementById('producto-imagen-archivo').files[0];
        const errorEl = document.getElementById('form-producto-error');
        const btnSubmit = e.target.querySelector('button[type="submit"]');

        const archivo2 = document.getElementById('producto-imagen-archivo-2').files[0];
        let imagenUrl = document.getElementById('producto-imagen').value;
        let imagenUrl2 = document.getElementById('producto-imagen-2').value;

        try {
            if (archivo) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Subiendo imagen...';
                imagenUrl = await subirImagen(archivo);
            }
            if (archivo2) {
                btnSubmit.disabled = true;
                btnSubmit.textContent = 'Subiendo segunda imagen...';
                imagenUrl2 = await subirImagen(archivo2);
            }
            btnSubmit.textContent = 'Guardar producto';
        } catch (err) {
            errorEl.textContent = err.message;
            errorEl.classList.remove('oculto');
            btnSubmit.disabled = false;
            btnSubmit.textContent = 'Guardar producto';
            return;
        }

        btnSubmit.disabled = false;

        const datos = {
            nombre: document.getElementById('producto-nombre').value,
            descripcion: document.getElementById('producto-descripcion').value,
            precio: parseFloat(document.getElementById('producto-precio').value),
            categoria: document.getElementById('producto-categoria').value,
            imagen_url: imagenUrl,
            imagen_url_2: imagenUrl2,
            ancho_cm: document.getElementById('producto-ancho').value ? parseFloat(document.getElementById('producto-ancho').value) : null,
            largo_cm: document.getElementById('producto-largo').value ? parseFloat(document.getElementById('producto-largo').value) : null,
            alto_cm: document.getElementById('producto-alto').value ? parseFloat(document.getElementById('producto-alto').value) : null,
            etiqueta: document.getElementById('producto-etiqueta').value || null
        };
        guardarProducto(datos, idProducto || null);
    });

    // Vista previa inmediata al seleccionar un archivo
    document.getElementById('producto-imagen-archivo').addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        const preview = document.getElementById('preview-imagen');
        const previewImg = document.getElementById('preview-imagen-img');
        const previewEstado = document.getElementById('preview-imagen-estado');

        if (!archivo) {
            preview.classList.add('oculto');
            return;
        }

        const lector = new FileReader();
        lector.onload = (evento) => {
            previewImg.src = evento.target.result;
            previewEstado.textContent = archivo.name;
            preview.classList.remove('oculto');
        };
        lector.readAsDataURL(archivo);
    });

    // Boton para quitar la foto principal
    document.getElementById('btn-quitar-imagen').addEventListener('click', () => {
        document.getElementById('producto-imagen').value = '';
        document.getElementById('producto-imagen-archivo').value = '';
        document.getElementById('preview-imagen').classList.add('oculto');
    });

    // Boton para quitar la segunda foto
    document.getElementById('btn-quitar-imagen-2').addEventListener('click', () => {
        document.getElementById('producto-imagen-2').value = '';
        document.getElementById('producto-imagen-archivo-2').value = '';
        document.getElementById('preview-imagen-2').classList.add('oculto');
    });

    // Vista previa inmediata para la segunda foto (opcional)
    document.getElementById('producto-imagen-archivo-2').addEventListener('change', (e) => {
        const archivo = e.target.files[0];
        const preview = document.getElementById('preview-imagen-2');
        const previewImg = document.getElementById('preview-imagen-img-2');
        const previewEstado = document.getElementById('preview-imagen-estado-2');

        if (!archivo) {
            preview.classList.add('oculto');
            return;
        }

        const lector = new FileReader();
        lector.onload = (evento) => {
            previewImg.src = evento.target.result;
            previewEstado.textContent = archivo.name;
            preview.classList.remove('oculto');
        };
        lector.readAsDataURL(archivo);
    });

    // Delegacion de eventos para los botones editar/borrar de la tabla
    document.getElementById('tabla-productos').addEventListener('click', (e) => {
        const btnEditar = e.target.closest('.btn-editar');
        const btnBorrar = e.target.closest('.btn-borrar');

        if (btnEditar) abrirFormularioProducto(btnEditar.dataset.id);
        else if (btnBorrar) borrarProducto(btnBorrar.dataset.id);
    });
});
