-- ============================================
-- Esquema de base de datos: MueblesCatalog
-- ============================================

-- Tabla de usuarios administradores
-- (los clientes NO se registran, el catalogo es publico y el carrito es local)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'admin',
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de productos (los muebles del catalogo)
CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12,2) NOT NULL,
    categoria VARCHAR(80),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW()
);

-- Tabla de vistas (para saber cuales son los productos mas vistos)
-- Cada fila = una vista individual, asi podemos contar y tambien analizar por fecha
CREATE TABLE IF NOT EXISTS vistas_producto (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    visto_en TIMESTAMP DEFAULT NOW()
);

-- Indice para acelerar el conteo de vistas por producto
CREATE INDEX IF NOT EXISTS idx_vistas_producto_id ON vistas_producto(producto_id);

-- Indice para filtrar productos activos y por categoria rapido
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- Segunda foto opcional por producto (agregada en paso 31)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url_2 TEXT;

-- Medidas del mueble en centimetros (agregado en paso 35)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS ancho_cm NUMERIC(6,1);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS largo_cm NUMERIC(6,1);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS alto_cm NUMERIC(6,1);

-- Etiqueta destacada opcional: 'nuevo', 'mas_vendido', o vacio (agregado en paso 101)
ALTER TABLE productos ADD COLUMN IF NOT EXISTS etiqueta VARCHAR(20);

-- Configuracion editable de la portada de inicio
CREATE TABLE IF NOT EXISTS homepage_config (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT
);
