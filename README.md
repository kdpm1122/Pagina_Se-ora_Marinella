# Pagina Señora Marinella

## Descripción general

`Pagina_Se-ora_Marinella` es un catálogo de muebles con carrito de compra web y gestión de productos para administrador. La aplicación está implementada con Node.js + Express en el backend y una interfaz estática en `public/` que consume la API y permite:

- navegar productos y ver detalles
- filtrar y ordenar el catálogo
- agregar elementos al carrito local
- generar cotización por WhatsApp
- administrar productos con login de administrador
- subir imágenes a Cloudinary

## Tecnologías principales

- Node.js + Express
- PostgreSQL (`pg`) para datos
- HTML/CSS/JS en frontend estático
- Cloudinary para alojar imágenes
- `esbuild` para minificar assets de producción
- `helmet` y `cors` para seguridad y APIs
- JWT para autenticación de administrador

## Estructura del proyecto

- `server.js` - servidor Express principal
- `routes/` - rutas de API
  - `auth.js` - autenticación de administrador
  - `productos.js` - CRUD de productos y estadísticas de vistas
  - `upload.js` - subida de imágenes a Cloudinary
- `middleware/auth.js` - verifica token JWT para rutas privadas
- `db/` - base de datos
  - `pool.js` - pool de conexión PostgreSQL
  - `schema.sql` - esquema de tablas y migraciones
  - `migrate.js` - script para crear tablas
  - `seed-admin.js` - script para crear usuario administrador
- `public/` - frontend estático
  - `index.html` - página de inicio
  - `categoria.html` - catálogo de productos
  - `admin.html` - panel de administración
  - `css/` - estilos fuente
  - `js/` - scripts fuente de frontend
  - `dist/` - assets minificados generados para producción

## Instalación y configuración

1. Clona el repositorio.
2. Instala dependencias:

```bash
npm install
```

3. Crea un archivo `.env` en la raíz con las variables necesarias:

```env
PORT=3000
DATABASE_URL=postgres://usuario:pass@host:puerto/dbname
JWT_SECRET=una_clave_secreta_larga
CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx
```

4. Crea la base de datos y las tablas:

```bash
node db/migrate.js
```

5. Crea el usuario administrador:

```bash
node db/seed-admin.js "Nombre" "admin@correo.com" "contraseña"
```

6. Genera los assets de producción:

```bash
npm run build
```

7. Inicia el servidor:

```bash
npm start
```

Para desarrollo con recarga automática:

```bash
npm run dev
```

## Scripts disponibles

- `npm run dev` - inicia el servidor con `nodemon`
- `npm run build` - minifica JS y CSS en `public/dist`
- `npm start` - inicia el servidor normal

## Backend y API

### `server.js`

- Configura `helmet` con CSP y `crossOriginResourcePolicy: false` para permitir recursos externos de imágenes.
- Usa `cors()` y `express.json()`.
- Sirve archivos estáticos desde `public/` con `maxAge: 1 día`.
- Define rutas de API en `/api/auth`, `/api/productos` y `/api/upload`.
- Agrega ruta de salud en `/api/health`.
- Devuelve `public/404.html` para rutas no encontradas.

### Rutas de API

#### Autenticación

- `POST /api/auth/login`
  - Requiere `email` y `password`.
  - Devuelve JWT y datos básicos del usuario.
  - Protegido por limitador de intentos (5 intentos / 15 minutos).

#### Productos

- `GET /api/productos`
  - Lista productos activos.
  - Devuelve campos: `id`, `nombre`, `descripcion`, `precio`, `categoria`, `imagen_url`, `imagen_url_2`, `ancho_cm`, `largo_cm`, `alto_cm`, `etiqueta`, `creado_en`.

- `GET /api/productos/stats/mas-vistos`
  - Requiere token admin.
  - Devuelve top de productos por vistas.

- `GET /api/productos/:id`
  - Devuelve detalle completo del producto.

- `POST /api/productos/:id/vista`
  - Registra una vista de producto.

- `POST /api/productos`
  - Crea producto (ruta admin privada).

- `PUT /api/productos/:id`
  - Edita producto (ruta admin privada).

- `DELETE /api/productos/:id`
  - Soft delete, marca producto como inactivo (ruta admin privada).

> Nota: el frontend actual contiene filtros de `color` y `material`, pero la API pública actual no expone esos campos ni el esquema SQL no define columnas `color`/`material`. Para habilitar esos filtros, agregue esas columnas al esquema y al `SELECT` de `/api/productos`.

### Subida de imágenes

- `POST /api/upload`
  - Ruta admin privada.
  - Usa `multer` en memoria para recibir imágenes JPEG/PNG/WEBP.
  - Convierte el archivo a Data URI y lo envía a Cloudinary.
  - Devuelve la URL segura de la imagen.

## Base de datos

### Esquema principal

#### `usuarios`

- `id`
- `nombre`
- `email`
- `password_hash`
- `rol`
- `creado_en`

#### `productos`

- `id`
- `nombre`
- `descripcion`
- `precio`
- `categoria`
- `imagen_url`
- `imagen_url_2`
- `activo`
- `creado_por`
- `creado_en`
- `actualizado_en`
- `ancho_cm`
- `largo_cm`
- `alto_cm`
- `etiqueta`

#### `vistas_producto`

- `id`
- `producto_id`
- `visto_en`

### Scripts de base de datos

- `node db/migrate.js` crea tablas e índices.
- `node db/seed-admin.js "Nombre" "email" "contraseña"` crea o actualiza el admin.

## Frontend

### Páginas principales

- `public/index.html` - página de inicio con navegación, CTA y estilos de presentación.
- `public/categoria.html` - catálogo de productos con filtros, búsqueda, ordenación y modal de detalle.
- `public/admin.html` - panel de administración con login, CRUD de productos y estadísticas de más vistos.

### Asset pipeline

- `public/js/catalogo.js` - carga productos, aplica filtros y controla el modal de detalle.
- `public/js/carrito.js` - maneja carrito persistente en `localStorage`, cantidades, subtotal y envío a WhatsApp.
- `public/js/color-fondo.js` - calcula el color dominante de las imágenes para mejorar el diseño visual.
- `public/js/admin.js` - controla el panel de administración, login, CRUD y estadísticas.
- `public/css/styles.css` - estilos principales del sitio.
- `public/css/inicio.css` - estilos de la página de inicio.
- `public/dist/` - versión minificada de CSS y JS generada por `npm run build`.

### Experiencia de usuario

- Productos con badges `Nuevo` y `Más vendido`.
- Filtros de categoría, color, material y rango de precio.
- Ordenación por popularidad, precio y nombre.
- Modal de detalle con carrusel de imágenes y productos relacionados.
- Carrito lateral con cantidad editable, subtotal y enlace de WhatsApp.
- Admin con login JWT y subida de imágenes a Cloudinary.

## Seguridad y producción

- `helmet` protege cabeceras HTTP y CSP.
- `cors` habilita el acceso a la API desde el mismo origen.
- Archivos estáticos servidos con cache de 1 día.
- Assets minificados con `esbuild` para producción.

## Notas importantes

- Asegúrate de que `JWT_SECRET` y las credenciales de Cloudinary estén definidas en `.env` antes de ejecutar el servidor.
- La ruta `/api/productos/stats/mas-vistos` debe definirse antes de `/:id` en `routes/productos.js` para evitar conflictos de ruta.
- El carrito del cliente se guarda en `localStorage`; no requiere sesión de usuario.

## Cómo contribuir

1. Crea una rama nueva.
2. Haz tus cambios.
3. Ejecuta la migración y el build si modificas backend o frontend.
4. Abre un PR con descripción de cambios.

---

`Pagina Señora Marinella` está diseñada para ser una tienda de catálogo simple con carrito local y backend administrado. Documenta cada pieza del flujo para facilitar mantenimiento y extensiones futuras.