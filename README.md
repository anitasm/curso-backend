# Entrega N°1 - Backend de Productos y Carritos

Autora: Ana Sol Mendoza
Proyecto backend básico en Node.js + Express para gestionar productos y carritos con persistencia en archivos JSON.

## 📌 Objetivo
Exponer una API REST con endpoints para crear, listar, actualizar y eliminar productos, además de manejar carritos y sus productos.

## ✅ Requisitos cumplidos
- Servidor Express escuchando en **puerto 8080**.
- Rutas `/api/products` y `/api/carts`.
- Persistencia con archivos JSON.
- IDs autogenerados y validaciones básicas.

## 🚀 Stack
- **Node.js** (runtime)
- **Express 5** (framework web)
- **fs/promises** (persistencia en archivos JSON)
- **nodemon** (modo desarrollo)

## 📂 Estructura del proyecto
```
src/
  app.js
  routes/
    products.router.js
    carts.router.js
  managers/
    ProductManager.js
    CartManager.js
  data/
    products.json
    carts.json
```

## ▶️ Cómo ejecutar
```bash
npm install
npm run dev
```
Servidor en: `http://localhost:8080`

## 🔌 Endpoints principales

### Productos `/api/products`
| Método | Ruta | Descripción |
| ------ | ---- | ----------- |
| GET | `/` | Listar todos los productos |
| GET | `/:pid` | Obtener producto por ID |
| POST | `/` | Crear producto |
| PUT | `/:pid` | Actualizar producto |
| DELETE | `/:pid` | Eliminar producto |

**Body POST/PUT (ejemplo):**
```json
{
  "title": "Camiseta",
  "description": "Camiseta negra",
  "code": "CAMI-001",
  "price": 12000,
  "status": true,
  "stock": 15,
  "category": "Ropa",
  "thumbnails": ["img/camiseta.png"]
}
```
# Entrega N°2 - Backend + Handlebars + Socket.io

Autora: Ana Sol Mendoza  
Proyecto Node.js + Express con API REST de productos y carritos, persistencia en JSON y vistas dinámicas.

## ✅ Qué incluye
- API REST existente sin romper compatibilidad:
  - `/api/products`
  - `/api/carts`
- Motor de plantillas **Handlebars**.
- Actualización en tiempo real con **Socket.io**.
- Vistas:
  - `/` → `home.handlebars` (solo lectura)
  - `/realtimeproducts` → `realTimeProducts.handlebars` (alta/baja en tiempo real)

## 📂 Estructura principal
```
src/
  app.js
  routes/
    products.router.js
    carts.router.js
    views.router.js
  managers/
    ProductManager.js
    CartManager.js
  views/
    layouts/
      main.handlebars
    home.handlebars
    realTimeProducts.handlebars
  public/
    js/
      realtime.js
    css/
      styles.css
  data/
    products.json
    carts.json
```

## ▶️ Cómo correr
```bash
npm install
npm run dev
```
O en modo producción:
```bash
npm start
```

Servidor: `http://localhost:8080`

## 🧪 Rutas para probar
- Home SSR: `GET /`
- Real time products: `GET /realtimeproducts`
- API productos: `GET /api/products`, `POST /api/products`, `DELETE /api/products/:pid`
- API carritos: `POST /api/carts`, `GET /api/carts/:cid`, `POST /api/carts/:cid/product/:pid`

## 🔁 Comportamiento esperado
- Si agregás/eliminás productos desde `/realtimeproducts`, la lista se actualiza en vivo.
- Si modificás productos por HTTP en `/api/products` (POST/DELETE), también se emite actualización por websocket.
- Al recargar `/`, se ven los cambios porque lee siempre desde `products.json`.

# Proyecto final - Rina Accesorios

Aplicación backend para una tienda de accesorios y pulseras construida con **Node.js, Express, Handlebars, Socket.io, Mongoose y MongoDB Atlas**. Incluye catálogo con paginación, detalle de producto, carrito y un panel administrativo en tiempo real para altas y bajas de productos.

## Tecnologías
- Node.js
- Express
- Handlebars
- Socket.io
- Mongoose
- MongoDB Atlas
- Multer

## Instalación
1. Cloná el repositorio.
2. Instalá dependencias:

```bash
npm install
```

## Variables de entorno
Creá un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
PORT=8080
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/rina?retryWrites=true&w=majority
```

### Conexión con MongoDB Atlas
- Creá un cluster en MongoDB Atlas.
- Configurá un usuario de base de datos con permisos de lectura y escritura.
- Agregá tu IP a la lista de acceso de red o habilitá temporalmente el acceso necesario para pruebas.
- Copiá la cadena de conexión SRV desde Atlas y pegala en `MONGO_URI`.
- Al iniciar la app, la conexión se realiza con Mongoose usando esa variable de entorno.

## Ejecución
Modo desarrollo:

```bash
npm run dev
```

Modo normal:

```bash
npm start
```

Servidor por defecto: `http://localhost:8080`

## Funcionalidades principales
- Catálogo de productos con paginación, filtros y orden por precio.
- Detalle individual de producto.
- Carritos persistidos en MongoDB.
- Panel de catálogo en tiempo real con creación y eliminación de productos.
- Carga opcional de imagen principal mediante formulario multipart.
- Generación automática del campo `code` en backend para cada producto nuevo.

## Rutas API
### Productos
- `GET /api/products`
- `GET /api/products/:pid`
- `POST /api/products`
- `PUT /api/products/:pid`
- `DELETE /api/products/:pid`

### Carritos
- `POST /api/carts`
- `GET /api/carts/:cid`
- `POST /api/carts/:cid/product/:pid`

## Rutas de vistas
- `/products`
- `/products/:pid`
- `/carts/:cid`
- `/realtimeproducts`

## Ejemplos de query params
```bash
/api/products?limit=5&page=1&sort=asc&query=pulseras
/api/products?query=true
```

## Notas para la entrega
- El identificador principal del producto es `_id`, generado por MongoDB.
- El campo `code` se genera automáticamente en backend con un formato legible y único.
- La vista `/realtimeproducts` está orientada a la gestión administrativa del catálogo y actualiza el listado en vivo con Socket.io.