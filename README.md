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