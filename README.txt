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
